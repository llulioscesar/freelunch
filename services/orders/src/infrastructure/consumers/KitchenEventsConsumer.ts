/**
 * Kitchen Events Consumer
 *
 * Listens to events from Kitchen Service and updates Orders accordingly.
 *
 * Events consumed:
 * - RECIPE_ASSIGNED: Kitchen selected a recipe for a dish
 * - DISH_PREPARING: Kitchen started preparing
 * - DISH_PREPARED: Dish is ready
 * - DISH_FAILED: Dish preparation failed
 *
 * Uses Redis Streams consumer groups for:
 * - Guaranteed delivery (events persist until ACK)
 * - Load balancing (multiple consumers can process in parallel)
 * - Fault tolerance (failed messages stay in pending list)
 */
import { Redis } from '@upstash/redis';
import { RedisClient } from '../adapters/cache/RedisClient';
import { UpdateOrderItemStatusUseCase } from '../../application/use-cases/UpdateOrderItemStatusUseCase';
import { OrderItemStatus } from '../../domain/entities/OrderItem';
import { logger } from '../logging/Logger';
import { metricsService } from '../metrics/MetricsService';

export interface KitchenEventPayload {
  event: string;
  orderId: string;
  itemId: string;
  recipeId?: string;
  recipeName?: string;
  reason?: string;
  timestamp: string;
}

export class KitchenEventsConsumer {
  private redis: Redis;
  private streamName = 'stream:kitchen:responses';
  private consumerGroup = 'orders-service';
  private consumerId: string;
  private isRunning = false;
  private pollInterval = 1000; // 1 second

  constructor(
    private readonly updateOrderItemUseCase: UpdateOrderItemStatusUseCase,
    consumerId?: string
  ) {
    this.redis = RedisClient.getInstance();
    this.consumerId = consumerId || `consumer-${Date.now()}-${process.pid}`;
  }

  /**
   * Initialize consumer group (idempotent)
   */
  async initialize(): Promise<void> {
    try {
      // First, ensure stream exists by adding a dummy entry if needed
      try {
        await this.redis.xadd(
          this.streamName,
          '*',
          { initialized: 'true', timestamp: new Date().toISOString() }
        );
      } catch (error) {
        // Stream might already exist, ignore
      }

      // Now create consumer group
      await this.redis.xgroup('CREATE', this.streamName, this.consumerGroup, '$');

      logger.info('Consumer group created', {
        streamName: this.streamName,
        consumerGroup: this.consumerGroup,
      });
    } catch (error: any) {
      if (error.message?.includes('BUSYGROUP')) {
        logger.info('Consumer group already exists', {
          consumerGroup: this.consumerGroup,
        });
      } else {
        logger.error('Failed to create consumer group', error, {
          streamName: this.streamName,
        });
        throw error;
      }
    }
  }

  /**
   * Start consuming events from Kitchen
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Consumer already running', {
        consumerId: this.consumerId,
      });
      return;
    }

    this.isRunning = true;

    logger.info('Kitchen Events Consumer started', {
      streamName: this.streamName,
      consumerGroup: this.consumerGroup,
      consumerId: this.consumerId,
    });

    await this.initialize();
    await this.consumeLoop();
  }

  /**
   * Stop consuming
   */
  stop(): void {
    this.isRunning = false;
    logger.info('Kitchen Events Consumer stopped', {
      consumerId: this.consumerId,
    });
  }

  /**
   * Main consumption loop
   */
  private async consumeLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Read new messages from stream
        const messages = await this.redis.xreadgroup(
          'GROUP',
          this.consumerGroup,
          this.consumerId,
          'BLOCK',
          5000, // Block for 5 seconds waiting for messages
          'COUNT',
          10, // Process up to 10 messages at a time
          'STREAMS',
          this.streamName,
          '>' // Read only new messages
        );

        if (!messages || messages.length === 0) {
          continue; // No new messages, continue loop
        }

        // Process messages
        for (const [_streamName, streamMessages] of messages as any) {
          for (const [messageId, fields] of streamMessages) {
            await this.processMessage(messageId, fields);
          }
        }
      } catch (error) {
        logger.error('Error in consume loop', error as Error, {
          consumerId: this.consumerId,
        });

        // Wait a bit before retrying
        await this.sleep(this.pollInterval);
      }
    }
  }

  /**
   * Process a single message
   */
  private async processMessage(messageId: string, fields: any): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse event payload
      const payload = this.parseEventPayload(fields);

      logger.debug('Processing Kitchen event', {
        messageId,
        event: payload.event,
        orderId: payload.orderId,
        itemId: payload.itemId,
      });

      // Map event to OrderItem status
      const status = this.mapEventToStatus(payload.event);

      if (!status) {
        logger.warn('Unknown event type, skipping', {
          event: payload.event,
          messageId,
        });
        // ACK unknown events to remove from pending
        await this.ackMessage(messageId);
        return;
      }

      // Execute use case to update order item
      const result = await this.updateOrderItemUseCase.execute({
        orderId: payload.orderId,
        itemId: payload.itemId,
        status,
        recipeId: payload.recipeId,
        recipeName: payload.recipeName,
        failureReason: payload.reason,
      });

      if (!result.success) {
        logger.error('Failed to update order item', new Error(result.error), {
          messageId,
          orderId: payload.orderId,
          itemId: payload.itemId,
        });
        // Don't ACK failed messages - they'll be retried
        return;
      }

      // ACK message after successful processing
      await this.ackMessage(messageId);

      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;

      logger.info('Kitchen event processed successfully', {
        messageId,
        event: payload.event,
        orderId: payload.orderId,
        itemId: payload.itemId,
        duration,
        progress: result.order?.progress,
      });

      // Record metrics
      metricsService.recordEventConsumed(
        payload.event,
        this.streamName,
        this.consumerGroup,
        durationSeconds,
        false
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;

      logger.error('Error processing message', error as Error, {
        messageId,
      });

      // Record error metrics
      metricsService.recordEventConsumed(
        'unknown',
        this.streamName,
        this.consumerGroup,
        durationSeconds,
        true
      );

      // Message stays in pending list for retry
    }
  }

  /**
   * Parse event payload from Redis Stream fields
   */
  private parseEventPayload(fields: any): KitchenEventPayload {
    // Redis Streams returns fields as key-value pairs
    const payload: any = {};

    // Convert array format to object
    if (Array.isArray(fields)) {
      for (let i = 0; i < fields.length; i += 2) {
        payload[fields[i]] = fields[i + 1];
      }
    } else {
      Object.assign(payload, fields);
    }

    // Parse nested JSON if needed
    if (payload.payload) {
      const parsed = JSON.parse(payload.payload);
      Object.assign(payload, parsed);
    }

    return payload as KitchenEventPayload;
  }

  /**
   * Map Kitchen event name to OrderItemStatus
   */
  private mapEventToStatus(eventName: string): OrderItemStatus | null {
    const mapping: Record<string, OrderItemStatus> = {
      RECIPE_ASSIGNED: OrderItemStatus.ASSIGNED,
      RECIPE_SELECTED: OrderItemStatus.ASSIGNED, // Alias
      DISH_PREPARING: OrderItemStatus.PREPARING,
      INGREDIENTS_REQUESTED: OrderItemStatus.INGREDIENTS_REQUESTED,
      COOKING: OrderItemStatus.COOKING,
      DISH_PREPARED: OrderItemStatus.READY,
      DISH_READY: OrderItemStatus.READY, // Alias
      DISH_FAILED: OrderItemStatus.FAILED,
    };

    return mapping[eventName] || null;
  }

  /**
   * Acknowledge message (remove from pending list)
   */
  private async ackMessage(messageId: string): Promise<void> {
    try {
      await this.redis.xack(this.streamName, this.consumerGroup, messageId);

      logger.debug('Message acknowledged', {
        messageId,
        streamName: this.streamName,
      });
    } catch (error) {
      logger.error('Failed to ACK message', error as Error, {
        messageId,
      });
    }
  }

  /**
   * Get pending messages (for debugging/monitoring)
   */
  async getPendingMessages(): Promise<any> {
    try {
      return await this.redis.xpending(
        this.streamName,
        this.consumerGroup,
        '-',
        '+',
        100 // Get up to 100 pending messages
      );
    } catch (error) {
      logger.error('Failed to get pending messages', error as Error);
      return [];
    }
  }

  /**
   * Claim stale messages (for fault tolerance)
   * Messages idle for more than 5 minutes will be claimed by this consumer
   */
  async claimStaleMessages(): Promise<void> {
    const minIdleTime = 300000; // 5 minutes in milliseconds

    try {
      const pending = await this.getPendingMessages();

      if (!pending || pending.length === 0) {
        return;
      }

      const staleMessageIds = pending
        .filter((msg: any) => msg.idleTime > minIdleTime)
        .map((msg: any) => msg.id);

      if (staleMessageIds.length === 0) {
        return;
      }

      logger.info('Claiming stale messages', {
        count: staleMessageIds.length,
        consumerId: this.consumerId,
      });

      for (const messageId of staleMessageIds) {
        await this.redis.xclaim(
          this.streamName,
          this.consumerGroup,
          this.consumerId,
          minIdleTime,
          messageId
        );
      }
    } catch (error) {
      logger.error('Failed to claim stale messages', error as Error);
    }
  }

  /**
   * Process a batch of messages (for serverless cron)
   * Returns the number of messages processed
   */
  async processBatch(maxMessages: number = 10): Promise<number> {
    try {
      // Read pending messages for this consumer
      const messages = await this.redis.xreadgroup(
        'GROUP',
        this.consumerGroup,
        this.consumerId,
        'COUNT',
        maxMessages,
        'STREAMS',
        this.streamName,
        '>' // Only new messages
      );

      if (!messages || messages.length === 0) {
        logger.debug('No messages to process');
        return 0;
      }

      let processedCount = 0;

      // Process each message
      for (const [streamName, streamMessages] of messages) {
        for (const [messageId, fields] of streamMessages) {
          try {
            await this.processMessage(messageId as string, fields);
            processedCount++;
          } catch (error) {
            logger.error('Failed to process message in batch', error as Error, {
              messageId,
              streamName,
            });
            // Continue processing other messages even if one fails
          }
        }
      }

      logger.info('Batch processing completed', {
        processedCount,
        consumerId: this.consumerId,
      });

      return processedCount;
    } catch (error) {
      logger.error('Batch processing failed', error as Error);
      return 0;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
