/**
 * Adapter: RedisStreamEventPublisher
 * Publishes domain events to Redis Streams
 */
import { Redis } from '@upstash/redis';
import { RedisClient } from '../cache/RedisClient';
import { EventPublisher } from '../../../application/ports/out/EventPublisher';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { logger } from '../../logging/Logger';

export class RedisStreamEventPublisher implements EventPublisher {
  private redis: Redis;
  private streamPrefix: string;

  constructor() {
    this.redis = RedisClient.getInstance();
    this.streamPrefix = process.env.EVENTS_STREAM_PREFIX || 'stream:events';
  }

  async publish(event: DomainEvent): Promise<void> {
    const streamName = `${this.streamPrefix}:${event.eventName}`;

    try {
      const messageData = {
        eventId: event.eventId,
        eventName: event.eventName,
        occurredAt: event.occurredAt.toISOString(),
        data: JSON.stringify(event.toPrimitives()),
      };

      const messageId = await this.redis.xadd(streamName, '*', messageData);

      logger.debug('Domain event published', {
        eventName: event.eventName,
        eventId: event.eventId,
        messageId,
        stream: streamName,
      });
    } catch (error) {
      logger.error('Failed to publish domain event', error as Error, {
        eventName: event.eventName,
        eventId: event.eventId,
      });
      throw error;
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
