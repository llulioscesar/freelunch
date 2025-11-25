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
  private streamName = 'stream:kitchen:events';
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
   * Initialize consumer group (idempotent) - Upstash syntax
   */
  async initialize(): Promise<void> {
    try {
      // Create consumer group with correct Upstash syntax
      await this.redis.xgroup(this.streamName, {
        type: 'CREATE',
        group: this.consumerGroup,
        id: '$', // Start from new messages
        options: { MKSTREAM: true }, // Create stream if doesn't exist
      });

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
   * Main consumption loop - Upstash XREADGROUP syntax
   */
  private async consumeLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Read new messages using Upstash XREADGROUP syntax
        const messages = await this.redis.xreadgroup(
          this.consumerGroup,
          this.consumerId,
          this.streamName,
          '>', // Read only new messages
          { count: 10 }
        );

        if (!messages || messages.length === 0) {
          await this.sleep(1000);
          continue;
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
      logger.debug('Executing UpdateOrderItemStatusUseCase', {
        messageId,
        orderId: payload.orderId,
        itemId: payload.itemId,
        targetStatus: status,
        recipeId: payload.recipeId,
        recipeName: payload.recipeName,
      });

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
          targetStatus: status,
          error: result.error,
        });

        // ACK messages for non-existent orders to avoid blocking the stream
        if (result.error === 'Order not found') {
          logger.warn('ACKing event for non-existent order (stale event)', {
            messageId,
            orderId: payload.orderId,
          });
          await this.ackMessage(messageId);
          return;
        }

        // Don't ACK other failures - they'll be retried
        return;
      }

      logger.debug('UpdateOrderItemStatusUseCase executed successfully', {
        messageId,
        itemId: payload.itemId,
        currentStatus: result.item?.status,
      });

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
      // payload.payload can be string or already parsed object
      let parsed;
      if (typeof payload.payload === 'string') {
        parsed = JSON.parse(payload.payload);
      } else {
        parsed = payload.payload;
      }
      // Standard format: { data: { ... } }
      const eventData = parsed.data || parsed;

      // Map Kitchen event format to expected format
      return {
        event: payload.eventType || eventData.eventName || payload.event,
        orderId: eventData.orderId,
        itemId: eventData.orderItemId, // Kitchen uses orderItemId
        recipeId: eventData.recipeId,
        recipeName: eventData.recipeName,
        reason: eventData.reason,
        timestamp: payload.occurredOn || eventData.occurredOn || new Date().toISOString(),
      } as KitchenEventPayload;
    }

    return payload as KitchenEventPayload;
  }

  /**
   * Map Kitchen event name to OrderItemStatus
   */
  private mapEventToStatus(eventName: string): OrderItemStatus | null {
    const mapping: Record<string, OrderItemStatus> = {
      // Current Kitchen event names (kitchen.*)
      'kitchen.plate.assigned': OrderItemStatus.ASSIGNED,
      'kitchen.ingredients.requested': OrderItemStatus.INGREDIENTS_REQUESTED,
      'kitchen.plate.cooking': OrderItemStatus.COOKING,
      'kitchen.plate.ready': OrderItemStatus.READY,
      'kitchen.plate.failed': OrderItemStatus.FAILED,

      // Legacy event names (for backward compatibility)
      RECIPE_ASSIGNED: OrderItemStatus.ASSIGNED,
      RECIPE_SELECTED: OrderItemStatus.ASSIGNED,
      DISH_PREPARING: OrderItemStatus.PREPARING,
      INGREDIENTS_REQUESTED: OrderItemStatus.INGREDIENTS_REQUESTED,
      COOKING: OrderItemStatus.COOKING,
      DISH_PREPARED: OrderItemStatus.READY,
      DISH_READY: OrderItemStatus.READY,
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
   * Process a batch of messages (for serverless cron) - Upstash syntax
   * Returns the number of messages processed
   */
  async processBatch(maxMessages: number = 10): Promise<number> {
    try {
      // Read messages using Upstash XREADGROUP syntax
      const messages = await this.redis.xreadgroup(
        this.consumerGroup,
        this.consumerId,
        this.streamName,
        '>', // Only new messages
        { count: maxMessages }
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
