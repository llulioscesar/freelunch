/**
 * Adapter: Redis Stream Event Publisher
 * Kitchen Service
 *
 * Implements the EventPublisher interface using Redis Streams for:
 * - Event persistence (events are stored)
 * - Guaranteed delivery (events survive service restarts)
 * - Consumer groups (multiple consumers can process events)
 * - Message ordering (FIFO within a stream)
 */
import { EventPublisher } from '../../../application/ports/out/EventPublisher.js';
import { DomainEvent } from '../../../domain/events/DomainEvent.js';
import { RedisClient } from '../cache/RedisClient.js';
import { logger } from '../../logging/Logger.js';
import { metricsService } from '../../metrics/MetricsService.js';

export class RedisStreamEventPublisher implements EventPublisher {
  private redis;
  private streamName: string;

  constructor() {
    this.redis = RedisClient.getInstance();
    this.streamName = process.env.KITCHEN_EVENTS_STREAM || 'stream:kitchen:events';
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

      // Record metrics
      metricsService.recordEventPublished(event.eventName, this.streamName);

      logger.info(`Event published to stream`, {
        eventType: event.eventName,
        streamName: this.streamName,
        messageId,
      });

    } catch (error: any) {
      logger.error(
        `Failed to publish event to Redis Stream: ${event.eventName}`,
        error,
        {
          eventType: event.eventName,
          streamName: this.streamName,
        }
      );
      throw new Error(`Event publishing failed: ${error.message}`);
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Use pipeline for batch operations (atomic + faster)
    const pipeline = this.redis.pipeline();

    for (const event of events) {
      const eventData = this.serializeEvent(event);
      pipeline.xadd(this.streamName, '*', eventData);
    }

    try {
      await pipeline.exec();

      // Record metrics for each event
      for (const event of events) {
        metricsService.recordEventPublished(event.eventName, this.streamName);
      }

      logger.info(`Batch published ${events.length} events to stream`, {
        streamName: this.streamName,
        eventCount: events.length,
      });
    } catch (error: any) {
      logger.error(`Failed to publish batch events`, error);
      throw new Error(`Batch event publishing failed: ${error.message}`);
    }
  }

  /**
   * Serialize domain event to Redis Stream format
   * Redis Streams expect flat key-value pairs
   */
  private serializeEvent(event: DomainEvent): Record<string, string> {
    const primitives = event.toPrimitives();

    return {
      eventType: event.eventName,
      eventId: event.eventId,
      occurredOn: event.occurredOn.toISOString(),
      payload: JSON.stringify(primitives),
    };
  }

  /**
   * Create consumer group for a stream (idempotent)
   * This should be called on service startup
   */
  async ensureConsumerGroup(streamName: string, groupName: string): Promise<void> {
    try {
      // Create consumer group with Upstash syntax
      await this.redis.xgroup(streamName, {
        type: 'CREATE',
        group: groupName,
        id: '$', // Start from new messages
        options: { MKSTREAM: true }, // Create stream if doesn't exist
      });

      logger.info(`Consumer group created`, {
        streamName,
        groupName,
      });
    } catch (error: any) {
      // BUSYGROUP error means group already exists (this is OK)
      if (error.message?.includes('BUSYGROUP')) {
        logger.info(`Consumer group already exists`, {
          groupName,
          streamName,
        });
      } else {
        logger.error(`Failed to create consumer group`, error, {
          streamName,
          groupName,
        });
        throw error;
      }
    }
  }

  /**
   * Get stream info (useful for monitoring)
   */
  async getStreamInfo(streamName?: string): Promise<any> {
    try {
      const stream = streamName || this.streamName;
      // @ts-ignore - call method exists at runtime but not in types
      return await this.redis.call('XINFO', 'STREAM', stream);
    } catch (error: any) {
      logger.error(`Failed to get stream info`, error, { streamName });
      return null;
    }
  }
}
