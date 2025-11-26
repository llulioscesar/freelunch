/**
 * Consumer: KitchenRequestsConsumer
 * Listens for ingredient requests from kitchen service via Redis Streams
 */
import { Redis } from '@upstash/redis';
import { RedisClient } from '../adapters/cache/RedisClient';
import { ProcessIngredientRequestUseCase } from '../../application/use-cases/ProcessIngredientRequestUseCase';
import { logger } from '../logging/Logger';

export interface KitchenRequestPayload {
  plateId: string;
  orderItemId: string;
  recipeId: string;
  recipeName: string;
  ingredients: string; // JSON string
  requestedAt: string;
}

export class KitchenRequestsConsumer {
  private redis: Redis;
  private streamName: string;
  private consumerGroup: string;
  private consumerId: string;
  private isRunning = false;
  private pollInterval = 1000;

  constructor(
    private readonly processIngredientRequestUseCase: ProcessIngredientRequestUseCase,
    consumerId?: string
  ) {
    this.redis = RedisClient.getInstance();
    this.streamName =
      process.env.WAREHOUSE_REQUESTS_STREAM || 'stream:warehouse:requests';
    this.consumerGroup =
      process.env.WAREHOUSE_CONSUMER_GROUP || 'warehouse-service';
    this.consumerId =
      consumerId || `warehouse-kitchen-req-${Date.now()}-${process.pid}`;
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

      logger.info('Kitchen requests consumer group created', {
        streamName: this.streamName,
        consumerGroup: this.consumerGroup,
      });
    } catch (error: any) {
      if (error.message?.includes('BUSYGROUP')) {
        logger.info('Kitchen requests consumer group already exists', {
          consumerGroup: this.consumerGroup,
        });
      } else {
        logger.error('Failed to create kitchen requests consumer group', error);
        throw error;
      }
    }
  }

  /**
   * Start consuming
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Kitchen requests consumer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Kitchen requests consumer started', {
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
    logger.info('Kitchen requests consumer stopped', {
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
        logger.error('Error in kitchen requests consume loop', error as Error, {
          consumerId: this.consumerId,
        });
        await this.sleep(this.pollInterval);
      }
    }
  }

  /**
   * Parse Redis Stream fields
   */
  private parseFields(fields: any): Record<string, string> {
    const parsed: Record<string, string> = {};

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
   * Supports unified payload.data wrapper format
   */
  private async processMessage(messageId: string, fields: any): Promise<void> {
    try {
      const parsedFields = this.parseFields(fields);

      // Extract data from unified wrapper format (payload.data)
      let data: KitchenRequestPayload;
      let ingredientsArray: Array<{ name: string; quantity: number }>;

      if (parsedFields.payload) {
        // New unified format: { eventType, eventId, aggregateId, occurredOn, payload: JSON.stringify({ data: {...} }) }
        // Handle both string and already-parsed object (Upstash may return either)
        let payloadObj;
        if (typeof parsedFields.payload === 'string') {
          payloadObj = JSON.parse(parsedFields.payload);
        } else {
          payloadObj = parsedFields.payload;
        }
        const innerData = payloadObj.data;

        data = {
          plateId: innerData.plateId,
          orderItemId: innerData.orderItemId,
          recipeId: innerData.recipeId,
          recipeName: innerData.recipeName,
          ingredients: JSON.stringify(innerData.ingredients), // Keep as string for interface compatibility
          requestedAt: innerData.requestedAt,
        };
        ingredientsArray = innerData.ingredients;
      } else {
        // Legacy flat format (backwards compatibility)
        data = {
          plateId: parsedFields.plateId,
          orderItemId: parsedFields.orderItemId,
          recipeId: parsedFields.recipeId,
          recipeName: parsedFields.recipeName,
          ingredients: parsedFields.ingredients,
          requestedAt: parsedFields.requestedAt,
        };
        // Handle both string and already-parsed object
        if (typeof data.ingredients === 'string') {
          ingredientsArray = JSON.parse(data.ingredients);
        } else {
          ingredientsArray = data.ingredients as any;
        }
      }

      // Convert ingredients to Record format for use case
      // Kitchen may send either:
      // - Object format: { "tomato": 2, "onion": 1 }
      // - Array format: [{ name: "tomato", quantity: 1 }, ...]
      // Use case expects: { "tomato": 1, ... }
      let ingredientsRecord: Record<string, number>;

      if (Array.isArray(ingredientsArray)) {
        // Array format - convert to Record
        ingredientsRecord = {};
        for (const item of ingredientsArray) {
          ingredientsRecord[item.name] = item.quantity;
        }
      } else if (typeof ingredientsArray === 'object' && ingredientsArray !== null) {
        // Already in object/Record format
        ingredientsRecord = ingredientsArray as unknown as Record<string, number>;
      } else {
        throw new Error(`Invalid ingredients format: ${typeof ingredientsArray}`);
      }

      logger.info('Processing kitchen ingredient request', {
        messageId,
        plateId: data.plateId,
        recipeId: data.recipeId,
        recipeName: data.recipeName,
      });

      // Process the request
      await this.processIngredientRequestUseCase.execute({
        plateId: data.plateId,
        orderItemId: data.orderItemId,
        recipeId: data.recipeId,
        recipeName: data.recipeName,
        ingredients: ingredientsRecord,
        requestedAt: data.requestedAt,
      });

      // Acknowledge message
      await this.redis.xack(this.streamName, this.consumerGroup, messageId);

      logger.debug('Kitchen request acknowledged', { messageId });
    } catch (error) {
      logger.error('Failed to process kitchen request', error as Error, {
        messageId,
      });
      // Message stays in pending list for retry
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
              logger.error('Failed to process pending kitchen request', error as Error, {
                messageId,
                streamName,
              });
            }
          }
        }

        logger.info('Pending kitchen requests processed', {
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
          logger.debug('No kitchen requests to process');
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
            logger.error('Failed to process kitchen request in batch', error as Error, {
              messageId,
              streamName,
            });
          }
        }
      }

      logger.info('Kitchen requests batch processing completed', {
        processedCount,
        consumerId: this.consumerId,
      });

      return processedCount;
    } catch (error) {
      logger.error('Kitchen requests batch processing failed', error as Error);
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
        100
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
  async claimStaleMessages(): Promise<number> {
    const minIdleTime = 300000; // 5 minutes in milliseconds

    try {
      const pending = await this.getPendingMessages();

      if (!pending || pending.length === 0) {
        return 0;
      }

      // XPENDING returns: [[messageId, consumerName, idleTime, deliveryCount], ...]
      const staleMessageIds = pending
        .filter((msg: any) => {
          const idleTime = Array.isArray(msg) ? msg[2] : msg.idleTime;
          return idleTime > minIdleTime;
        })
        .map((msg: any) => (Array.isArray(msg) ? msg[0] : msg.id));

      if (staleMessageIds.length === 0) {
        return 0;
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

      return staleMessageIds.length;
    } catch (error) {
      logger.error('Failed to claim stale messages', error as Error);
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
