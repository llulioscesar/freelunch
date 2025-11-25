/**
 * Adapter: RedisKitchenClient
 * Sends responses back to kitchen service via Redis Streams
 */
import { Redis } from '@upstash/redis';
import { RedisClient } from '../cache/RedisClient';
import { KitchenClient } from '../../../application/ports/out/KitchenClient';
import { IngredientsResponseDTO } from '../../../application/dto/IngredientsRequestDTO';
import { logger } from '../../logging/Logger';

export class RedisKitchenClient implements KitchenClient {
  private redis: Redis;
  private responsesStream: string;

  constructor() {
    this.redis = RedisClient.getInstance();
    this.responsesStream =
      process.env.WAREHOUSE_RESPONSES_STREAM || 'stream:warehouse:responses';
  }

  /**
   * Send ingredients response to kitchen
   * Uses unified payload.data wrapper format
   */
  async sendIngredientsResponse(response: IngredientsResponseDTO): Promise<void> {
    try {
      const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const eventType = response.success ? 'IngredientsReady' : 'IngredientsUnavailable';

      const innerData: Record<string, unknown> = {
        plateId: response.plateId,
        orderItemId: response.orderItemId,
        success: response.success,
        ingredients: response.ingredients,
        processedAt: response.processedAt,
      };

      if (response.availableIngredients) {
        innerData.availableIngredients = response.availableIngredients;
      }

      if (response.unavailableIngredients) {
        innerData.unavailableIngredients = response.unavailableIngredients;
      }

      if (response.message) {
        innerData.message = response.message;
      }

      const messageData = {
        eventType,
        eventId,
        aggregateId: response.plateId,
        occurredOn: new Date().toISOString(),
        payload: JSON.stringify({
          data: innerData,
        }),
      };

      const messageId = await this.redis.xadd(
        this.responsesStream,
        '*',
        messageData
      );

      logger.info('Sent ingredients response to kitchen', {
        plateId: response.plateId,
        success: response.success,
        messageId,
        stream: this.responsesStream,
      });
    } catch (error) {
      logger.error('Failed to send ingredients response', error as Error, {
        plateId: response.plateId,
      });
      throw error;
    }
  }
}
