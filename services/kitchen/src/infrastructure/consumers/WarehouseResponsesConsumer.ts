/**
 * Warehouse Responses Consumer
 * Kitchen Service
 *
 * Listens to responses from Warehouse Service about ingredient availability.
 *
 * Events consumed:
 * - IngredientsReady: All ingredients available, continue cooking
 * - IngredientsUnavailable: Some/all ingredients unavailable, mark plate as failed
 *
 * Uses Redis Streams consumer groups for guaranteed delivery
 */
import { Redis } from '@upstash/redis';
import { RedisClient } from '../adapters/cache/RedisClient';
import { logger } from '../logging/Logger';
import { PlateRepository } from '../../domain/repositories/PlateRepository';
import { PlateId } from '../../domain/value-objects/PlateId';
import { EventPublisher } from '../../application/ports/out/EventPublisher';
import { metricsService } from '../metrics/MetricsService';

export interface IngredientsResponsePayload {
  plateId: string;
  orderItemId: string;
  success: boolean;
  ingredients: string; // JSON string
  availableIngredients?: string; // JSON string
  unavailableIngredients?: string; // JSON array string
  message?: string;
  processedAt: string;
}

export class WarehouseResponsesConsumer {
  private redis: Redis;
  private streamName: string;
  private consumerGroup: string;
  private consumerId: string;
  private isRunning = false;
  private pollInterval = 1000;

  constructor(
    private readonly plateRepository: PlateRepository,
    private readonly eventPublisher: EventPublisher,
    consumerId?: string
  ) {
    this.redis = RedisClient.getInstance();
    this.streamName =
      process.env.WAREHOUSE_RESPONSES_STREAM || 'stream:warehouse:responses';
    this.consumerGroup =
      process.env.KITCHEN_CONSUMER_GROUP || 'kitchen-service';
    this.consumerId =
      consumerId || `kitchen-warehouse-resp-${Date.now()}-${process.pid}`;
  }

  /**
   * Initialize consumer group
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.xgroup(this.streamName, {
        type: 'CREATE',
        group: this.consumerGroup,
        id: '$',
        options: { MKSTREAM: true },
      });

      logger.info('Warehouse responses consumer group created', {
        streamName: this.streamName,
        consumerGroup: this.consumerGroup,
      });
    } catch (error: any) {
      if (error.message?.includes('BUSYGROUP')) {
        logger.info('Warehouse responses consumer group already exists', {
          consumerGroup: this.consumerGroup,
        });
      } else {
        logger.error('Failed to create warehouse responses consumer group', error);
        throw error;
      }
    }
  }

  /**
   * Start consuming
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Warehouse responses consumer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Warehouse responses consumer started', {
      consumerId: this.consumerId,
      streamName: this.streamName,
    });

    await this.consumeLoop();
  }

  /**
   * Stop consuming
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info('Warehouse responses consumer stopped', {
      consumerId: this.consumerId,
    });
  }

  /**
   * Main consumption loop
   */
  private async consumeLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const messages = await this.redis.xreadgroup(
          this.consumerGroup,
          this.consumerId,
          this.streamName,
          '>',
          { count: 10 }
        );

        if (!messages || messages.length === 0) {
          await this.sleep(this.pollInterval);
          continue;
        }

        for (const [_streamName, streamMessages] of messages as any) {
          for (const [messageId, fields] of streamMessages) {
            await this.processMessage(messageId, fields);
          }
        }
      } catch (error) {
        logger.error('Error in warehouse responses consume loop', error as Error, {
          consumerId: this.consumerId,
        });
        await this.sleep(this.pollInterval);
      }
    }
  }

  /**
   * Parse Redis Stream fields (can be array or object)
   */
  private parseFields(fields: any): Record<string, string> {
    const parsed: Record<string, string> = {};

    // Redis Streams can return fields as [key1, value1, key2, value2]
    if (Array.isArray(fields)) {
      for (let i = 0; i < fields.length; i += 2) {
        parsed[fields[i]] = fields[i + 1];
      }
    } else {
      Object.assign(parsed, fields);
    }

    return parsed;
  }

  /**
   * Process a single message
   */
  private async processMessage(
    messageId: string,
    fields: any
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse fields from Redis format
      const parsedFields = this.parseFields(fields);

      const data: IngredientsResponsePayload = {
        plateId: parsedFields.plateId,
        orderItemId: parsedFields.orderItemId,
        success: parsedFields.success === 'true',
        ingredients: parsedFields.ingredients,
        availableIngredients: parsedFields.availableIngredients,
        unavailableIngredients: parsedFields.unavailableIngredients,
        message: parsedFields.message,
        processedAt: parsedFields.processedAt,
      };

      logger.info('Processing warehouse response', {
        messageId,
        plateId: data.plateId,
        success: data.success,
      });

      if (data.success) {
        await this.handleIngredientsReady(data);
      } else {
        await this.handleIngredientsUnavailable(data);
      }

      // Acknowledge message
      await this.redis.xack(this.streamName, this.consumerGroup, messageId);

      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      metricsService.recordEventConsumed(
        'IngredientsResponse',
        this.streamName,
        this.consumerGroup,
        duration,
        false
      );

      logger.debug('Warehouse response acknowledged', { messageId });
    } catch (error) {
      // Record error metrics
      const duration = (Date.now() - startTime) / 1000;
      metricsService.recordEventConsumed(
        'IngredientsResponse',
        this.streamName,
        this.consumerGroup,
        duration,
        true
      );

      logger.error('Failed to process warehouse response', error as Error, {
        messageId,
      });
      // Message stays in pending list for retry
    }
  }

  /**
   * Handle successful ingredient allocation
   */
  private async handleIngredientsReady(
    data: IngredientsResponsePayload
  ): Promise<void> {
    try {
      // Find plate
      const plate = await this.plateRepository.findById(new PlateId(data.plateId));
      if (!plate) {
        logger.error('Plate not found for warehouse response', undefined, {
          plateId: data.plateId,
        });
        return;
      }

      // Start cooking
      plate.startCooking();

      // Save plate
      await this.plateRepository.save(plate);

      logger.info('Plate started cooking', {
        plateId: data.plateId,
        orderItemId: data.orderItemId,
      });

      // Simulate cooking time (in real app, this could be a background job)
      // For now, immediately mark as ready
      plate.markAsReady();
      await this.plateRepository.save(plate);

      // Publish domain events
      const events = plate.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      plate.clearDomainEvents();

      // Record metrics
      metricsService.recordIngredientsAvailable(data.plateId, plate.getRecipeId()?.getValue() || 'unknown');
      if (plate.getRecipeId() && plate.getAssignedAt() && plate.getReadyAt()) {
        const cookingTime = (plate.getReadyAt()!.getTime() - plate.getAssignedAt()!.getTime()) / 1000;
        metricsService.recordPlateReady(
          plate.getRecipeId()!.getValue(),
          plate.getRecipeName() || 'unknown',
          cookingTime
        );
      }

      logger.info('Plate ready', {
        plateId: data.plateId,
        orderItemId: data.orderItemId,
      });
    } catch (error) {
      logger.error('Failed to handle ingredients ready', error as Error, {
        plateId: data.plateId,
      });
      throw error;
    }
  }

  /**
   * Handle ingredient unavailability
   */
  private async handleIngredientsUnavailable(
    data: IngredientsResponsePayload
  ): Promise<void> {
    try {
      // Find plate
      const plate = await this.plateRepository.findById(new PlateId(data.plateId));
      if (!plate) {
        logger.error('Plate not found for warehouse response', undefined, {
          plateId: data.plateId,
        });
        return;
      }

      // Mark plate as failed
      const reason =
        data.message || 'Ingredients unavailable from warehouse';
      plate.markAsFailed(reason);

      // Save plate
      await this.plateRepository.save(plate);

      // Publish domain events
      const events = plate.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      plate.clearDomainEvents();

      // Record metrics
      metricsService.recordIngredientsUnavailable(
        data.plateId,
        plate.getRecipeId()?.getValue() || 'unknown',
        reason
      );
      metricsService.recordPlateFailed(reason);

      logger.warn('Plate failed due to unavailable ingredients', {
        plateId: data.plateId,
        orderItemId: data.orderItemId,
        reason,
      });
    } catch (error) {
      logger.error('Failed to handle ingredients unavailable', error as Error, {
        plateId: data.plateId,
      });
      throw error;
    }
  }

  /**
   * Process a batch of messages (for serverless cron)
   */
  async processBatch(maxMessages: number = 10): Promise<number> {
    try {
      const messages = await this.redis.xreadgroup(
        this.consumerGroup,
        this.consumerId,
        this.streamName,
        '>',
        { count: maxMessages }
      );

      if (!messages || messages.length === 0) {
        logger.debug('No warehouse responses to process');
        return 0;
      }

      let processedCount = 0;

      for (const [streamName, streamMessages] of messages as any) {
        for (const [messageId, fields] of streamMessages) {
          try {
            await this.processMessage(messageId as string, fields);
            processedCount++;
          } catch (error) {
            logger.error('Failed to process warehouse response in batch', error as Error, {
              messageId,
              streamName,
            });
          }
        }
      }

      logger.info('Warehouse responses batch processing completed', {
        processedCount,
        consumerId: this.consumerId,
      });

      return processedCount;
    } catch (error) {
      logger.error('Warehouse responses batch processing failed', error as Error);
      return 0;
    }
  }

  /**
   * Utility: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
