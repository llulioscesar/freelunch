/**
 * Adapter: Redis Stream Event Publisher
 *
 * Implements the EventPublisher interface using Redis Streams for:
 * - Event persistence (events are stored)
 * - Guaranteed delivery (events survive service restarts)
 * - Consumer groups (multiple consumers can process events)
 * - Message ordering (FIFO within a stream)
 *
 * Redis Streams vs Pub/Sub:
 * ✅ Streams: Persistent, can replay, consumer groups
 * ❌ Pub/Sub: Fire-and-forget, lost if no listener
 */
import { EventPublisher } from '../../../application/ports/out/EventPublisher';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { RedisClient } from '../cache/RedisClient';
import { logger } from '../../logging/Logger';
import { metricsService } from '../../metrics/MetricsService';

export class RedisStreamEventPublisher implements EventPublisher {
  private redis;
  private streamName = 'orders:events';

  constructor() {
    this.redis = RedisClient.getInstance();
  }

  async publish(event: DomainEvent): Promise<void> {
    try {
      const eventData = this.serializeEvent(event);

      // Add event to Redis Stream
      // XADD stream-name * field1 value1 field2 value2 ...
      const messageId = await this.redis.xadd(
        this.streamName,
        '*', // Auto-generate ID (timestamp-sequence)
        eventData
      );

      logger.logEventPublished(event.eventName(), this.streamName, messageId as string, {
        aggregateId: event.aggregateId,
      });

      // Record metrics
      metricsService.recordEventPublished(event.eventName(), this.streamName);

      // Route specific events to specialized streams for targeted consumers
      await this.routeEventToSpecializedStream(event);

    } catch (error: any) {
      logger.error(`Failed to publish event to Redis Stream: ${event.eventName()}`, error as Error, {
        eventType: event.eventName(),
        aggregateId: event.aggregateId,
      });
      throw new Error(`Event publishing failed: ${error.message}`);
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    // Use pipeline for batch operations (atomic + faster)
    const pipeline = this.redis.pipeline();

    for (const event of events) {
      const eventData = this.serializeEvent(event);
      pipeline.xadd(this.streamName, '*', eventData);
    }

    try {
      await pipeline.exec();
      console.log(`📡 Batch published ${events.length} events to stream`);
    } catch (error: any) {
      console.error(`❌ Failed to publish batch events`, error);
      throw new Error(`Batch event publishing failed: ${error.message}`);
    }
  }

  /**
   * Route events to specialized streams for different consumers
   * This allows services to subscribe only to events they care about
   */
  private async routeEventToSpecializedStream(event: DomainEvent): Promise<void> {
    const routingMap: Record<string, string> = {
      // Kitchen Service listens to this stream
      'order.created': 'stream:orders:events',

      // Warehouse Service listens to this stream
      'ingredients.requested': 'stream:warehouse:requests',

      // Analytics Service listens to this stream
      'order.completed': 'stream:analytics',
      'order.failed': 'stream:analytics',
    };

    const targetStream = routingMap[event.eventName()];

    if (targetStream) {
      const eventData = this.serializeEvent(event);
      await this.redis.xadd(targetStream, '*', eventData);
      logger.debug(`Event routed to specialized stream`, {
        eventType: event.eventName(),
        targetStream,
        aggregateId: event.aggregateId,
      });
    }
  }

  /**
   * Serialize domain event to Redis Stream format
   * Redis Streams expect flat key-value pairs
   */
  private serializeEvent(event: DomainEvent): Record<string, string> {
    const primitives = (event as any).toPrimitives?.() || {};

    return {
      eventType: event.eventName(),
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn.toISOString(),
      payload: JSON.stringify({
        data: primitives,
      }),
    };
  }

  /**
   * Create consumer group for a stream (idempotent)
   * This should be called on service startup
   */
  async ensureConsumerGroup(streamName: string, groupName: string): Promise<void> {
    try {
      // XGROUP CREATE stream group $ MKSTREAM
      // $ means start consuming from new messages only
      // MKSTREAM creates the stream if it doesn't exist
      await this.redis.xgroup(
        'CREATE',
        streamName,
        groupName,
        '$',
        'MKSTREAM'
      );
      console.log(`✅ Consumer group created: ${groupName} on ${streamName}`);
    } catch (error: any) {
      // BUSYGROUP error means group already exists (this is OK)
      if (error.message?.includes('BUSYGROUP')) {
        console.log(`ℹ️  Consumer group already exists: ${groupName}`);
      } else {
        console.error(`❌ Failed to create consumer group: ${groupName}`, error);
        throw error;
      }
    }
  }

  /**
   * Get stream info (useful for monitoring)
   */
  async getStreamInfo(streamName: string = this.streamName): Promise<any> {
    try {
      return await this.redis.xinfo('STREAM', streamName);
    } catch (error: any) {
      console.error(`❌ Failed to get stream info`, error);
      return null;
    }
  }
}
