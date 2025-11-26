/**
 * Adapter: Redis Warehouse Client
 * Kitchen Service
 *
 * Implements WarehouseClient interface using Redis Streams for async communication.
 *
 * Flow:
 * 1. Kitchen publishes ingredient request to warehouse:requests stream
 * 2. Warehouse processes request
 * 3. Warehouse publishes response to warehouse:responses stream
 * 4. Kitchen consumes response via WarehouseResponsesConsumer
 */
import { Redis } from '@upstash/redis';
import { RedisClient } from '../cache/RedisClient';
import {
  WarehouseClient,
  IngredientsRequestPayload,
} from '../../../application/ports/out/WarehouseClient';
import { logger } from '../../logging/Logger';

export class RedisWarehouseClient implements WarehouseClient {
  private redis: Redis;
  private requestsStream: string;
  private responsesStream: string;
  private consumerGroup: string;
  private consumerId: string;
  private isRunning = false;

  constructor(consumerId?: string) {
    this.redis = RedisClient.getInstance();
    this.requestsStream =
      process.env.WAREHOUSE_REQUESTS_STREAM || 'stream:warehouse:requests';
    this.responsesStream =
      process.env.WAREHOUSE_RESPONSES_STREAM || 'stream:warehouse:responses';
    this.consumerGroup =
      process.env.KITCHEN_CONSUMER_GROUP || 'kitchen-service';
    this.consumerId =
      consumerId || `kitchen-warehouse-${Date.now()}-${process.pid}`;
  }

  /**
   * Request ingredients from warehouse (async)
   * Publishes event to warehouse:requests stream
   * Uses unified payload.data wrapper format
   */
  async requestIngredients(payload: IngredientsRequestPayload): Promise<void> {
    try {
      const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const messageData = {
        eventType: 'IngredientsRequested',
        eventId,
        aggregateId: payload.plateId,
        occurredOn: new Date().toISOString(),
        payload: JSON.stringify({
          data: {
            plateId: payload.plateId,
            orderItemId: payload.orderItemId,
            recipeId: payload.recipeId,
            recipeName: payload.recipeName,
            ingredients: payload.ingredients,
            requestedAt: payload.requestedAt,
            requestedBy: 'kitchen-service',
          },
        }),
      };

      // Publish to warehouse requests stream
      const messageId = await this.redis.xadd(
        this.requestsStream,
        '*',
        messageData
      );

      logger.info('Ingredients request sent to Warehouse', {
        plateId: payload.plateId,
        recipeId: payload.recipeId,
        recipeName: payload.recipeName,
        messageId,
        stream: this.requestsStream,
      });
    } catch (error) {
      logger.error('Failed to request ingredients from Warehouse', error as Error, {
        plateId: payload.plateId,
      });
      throw error;
    }
  }

  /**
   * Initialize consumer to listen for warehouse responses
   */
  async initialize(): Promise<void> {
    try {
      // Create consumer group for warehouse responses stream
      await this.redis.xgroup(this.responsesStream, {
        type: 'CREATE',
        group: this.consumerGroup,
        id: '$',
        options: { MKSTREAM: true },
      });

      logger.info('Warehouse responses consumer group created', {
        stream: this.responsesStream,
        group: this.consumerGroup,
      });
    } catch (error: any) {
      if (error.message?.includes('BUSYGROUP')) {
        logger.info('Warehouse responses consumer group already exists', {
          group: this.consumerGroup,
        });
      } else {
        logger.error('Failed to create warehouse responses consumer group', error);
        throw error;
      }
    }
  }

  /**
   * Start consuming responses from warehouse
   */
  async startConsuming(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Warehouse responses consumer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Warehouse responses consumer started', {
      consumerId: this.consumerId,
      stream: this.responsesStream,
    });

    await this.consumeLoop();
  }

  /**
   * Stop consuming
   */
  async stopConsuming(): Promise<void> {
    this.isRunning = false;
    logger.info('Warehouse responses consumer stopped', {
      consumerId: this.consumerId,
    });
  }

  /**
   * Main consumption loop (private - managed internally)
   */
  private async consumeLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const messages = await this.redis.xreadgroup(
          this.consumerGroup,
          this.consumerId,
          this.responsesStream,
          '>',
          { count: 10 }
        );

        if (!messages || messages.length === 0) {
          await this.sleep(1000);
          continue;
        }

        // Process responses (handled by WarehouseResponsesConsumer)
        // This is a placeholder - actual processing happens in the consumer
        for (const [_streamName, streamMessages] of messages as any) {
          for (const [messageId] of streamMessages) {
            logger.debug('Warehouse response received', {
              messageId,
              consumerId: this.consumerId,
            });
          }
        }
      } catch (error) {
        logger.error('Error in warehouse responses consume loop', error as Error);
        await this.sleep(1000);
      }
    }
  }

  /**
   * Utility: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
