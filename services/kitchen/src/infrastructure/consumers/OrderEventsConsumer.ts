/**
 * Order Events Consumer
 * Kitchen Service
 *
 * Listens to events from Orders Service and processes them.
 *
 * Events consumed:
 * - OrderCreated: Create plates for each order item and assign recipes
 *
 * Uses Redis Streams consumer groups for:
 * - Guaranteed delivery (events persist until ACK)
 * - Load balancing (multiple consumers can process in parallel)
 * - Fault tolerance (failed messages stay in pending list)
 */
import { Redis } from '@upstash/redis';
import { RedisClient } from '../adapters/cache/RedisClient';
import { ProcessOrderUseCase } from '../../application/use-cases/ProcessOrderUseCase';
import { AssignRecipeUseCase } from '../../application/use-cases/AssignRecipeUseCase';
import { logger } from '../logging/Logger';

export interface OrderCreatedEventPayload {
  eventType: string;
  orderId: string;
  quantity: number;
  customerName: string;
  items: Array<{
    itemId: string;
    orderId: string;
  }>;
}

export class OrderEventsConsumer {
  private redis: Redis;
  private streamName: string;
  private consumerGroup: string;
  private consumerId: string;
  private isRunning = false;
  private pollInterval = 1000; // 1 second

  constructor(
    private readonly processOrderUseCase: ProcessOrderUseCase,
    private readonly assignRecipeUseCase: AssignRecipeUseCase,
    consumerId?: string
  ) {
    this.redis = RedisClient.getInstance();
    this.streamName = process.env.ORDERS_EVENTS_STREAM || 'stream:orders:events';
    this.consumerGroup =
      process.env.KITCHEN_CONSUMER_GROUP || 'kitchen-service';
    this.consumerId =
      consumerId || `kitchen-consumer-${Date.now()}-${process.pid}`;
  }

  /**
   * Initialize consumer group (idempotent)
   */
  async initialize(): Promise<void> {
    try {
      // Create consumer group with Upstash syntax
      await this.redis.xgroup(this.streamName, {
        type: 'CREATE',
        group: this.consumerGroup,
        id: '$', // Start from new messages
        options: { MKSTREAM: true },
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
   * Start consuming events (long-running process)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Consumer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Order events consumer started', {
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
    logger.info('Order events consumer stopped', {
      consumerId: this.consumerId,
    });
  }

  /**
   * Main consumption loop
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
          await this.sleep(this.pollInterval);
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
    try {
      // Parse fields from Redis format
      const parsedFields = this.parseFields(fields);
      const eventType = parsedFields.eventType;

      // payload can come as string or already parsed object
      let payload;
      if (typeof parsedFields.payload === 'string') {
        payload = JSON.parse(parsedFields.payload || '{}');
      } else {
        payload = parsedFields.payload || {};
      }

      logger.info(`Processing event from Orders`, {
        messageId,
        eventType,
        orderId: payload.data?.orderId,
      });

      // Route to appropriate handler
      switch (eventType) {
        case 'order.created':
          await this.handleOrderCreated(payload.data);
          break;
        default:
          logger.warn(`Unknown event type: ${eventType}`, { messageId });
      }

      // Acknowledge message (remove from pending list)
      await this.redis.xack(this.streamName, this.consumerGroup, messageId);

      logger.debug(`Message acknowledged`, { messageId });
    } catch (error) {
      logger.error('Failed to process message', error as Error, {
        messageId,
        fields,
      });
      // Message stays in pending list for retry
    }
  }

  /**
   * Handle OrderCreated event
   */
  private async handleOrderCreated(data: OrderCreatedEventPayload): Promise<void> {
    try {
      logger.info(`Handling OrderCreated event`, {
        orderId: data.orderId,
        itemsCount: data.items.length,
      });

      // Step 1: Create plates for each order item
      const result = await this.processOrderUseCase.execute({
        orderId: data.orderId,
        items: data.items,
        quantity: data.quantity,
        customerName: data.customerName,
      });

      logger.info(`Plates created for order`, {
        orderId: data.orderId,
        platesCreated: result.platesCreated,
      });

      // Step 2: Assign recipe to each plate
      for (const plate of result.plates) {
        await this.assignRecipeUseCase.execute({
          plateId: plate.plateId,
        });

        logger.info(`Recipe assigned to plate`, {
          plateId: plate.plateId,
          orderItemId: plate.orderItemId,
        });
      }

      logger.info(`Order processing completed`, {
        orderId: data.orderId,
        platesCreated: result.platesCreated,
      });
    } catch (error) {
      logger.error('Failed to handle OrderCreated event', error as Error, {
        orderId: data.orderId,
      });
      throw error;
    }
  }

  /**
   * Process a batch of messages (for serverless cron)
   */
  async processBatch(maxMessages: number = 10): Promise<number> {
    let processedCount = 0;

    try {
      // STEP 1: Process pending messages first (retry failed ones)
      const pendingMessages = await this.redis.xreadgroup(
        this.consumerGroup,
        this.consumerId,
        this.streamName,
        '0', // Read pending messages for this consumer
        { count: maxMessages }
      );

      if (pendingMessages && pendingMessages.length > 0) {
        for (const [streamName, streamMessages] of pendingMessages as any) {
          for (const [messageId, fields] of streamMessages) {
            try {
              await this.processMessage(messageId as string, fields);
              processedCount++;
            } catch (error) {
              logger.error('Failed to process pending message', error as Error, {
                messageId,
                streamName,
              });
            }
          }
        }

        logger.info('Pending messages processed', {
          count: processedCount,
          consumerId: this.consumerId,
        });
      }

      // STEP 2: Process new messages
      const remainingSlots = maxMessages - processedCount;
      if (remainingSlots <= 0) {
        return processedCount;
      }

      const newMessages = await this.redis.xreadgroup(
        this.consumerGroup,
        this.consumerId,
        this.streamName,
        '>', // Only new messages
        { count: remainingSlots }
      );

      if (!newMessages || newMessages.length === 0) {
        if (processedCount === 0) {
          logger.debug('No messages to process');
        }
        return processedCount;
      }

      // Process each new message
      for (const [streamName, streamMessages] of newMessages as any) {
        for (const [messageId, fields] of streamMessages) {
          try {
            await this.processMessage(messageId as string, fields);
            processedCount++;
          } catch (error) {
            logger.error('Failed to process message in batch', error as Error, {
              messageId,
              streamName,
            });
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
      return processedCount;
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

      // XPENDING returns: [[messageId, consumerName, idleTime, deliveryCount], ...]
      const staleMessageIds = pending
        .filter((msg: any) => {
          const idleTime = Array.isArray(msg) ? msg[2] : msg.idleTime;
          return idleTime > minIdleTime;
        })
        .map((msg: any) => (Array.isArray(msg) ? msg[0] : msg.id));

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
   * Utility: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
