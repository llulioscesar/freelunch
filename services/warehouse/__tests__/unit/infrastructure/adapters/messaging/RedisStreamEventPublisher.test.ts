import { RedisStreamEventPublisher } from '../../../../../src/infrastructure/adapters/messaging/RedisStreamEventPublisher';
import { DomainEvent } from '../../../../../src/domain/events/DomainEvent';

// Mock RedisClient
jest.mock('../../../../../src/infrastructure/adapters/cache/RedisClient', () => ({
  RedisClient: {
    getInstance: jest.fn().mockReturnValue({
      xadd: jest.fn().mockResolvedValue('1234567890-0'),
    }),
  },
}));

// Mock logger
jest.mock('../../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

import { RedisClient } from '../../../../../src/infrastructure/adapters/cache/RedisClient';
import { logger } from '../../../../../src/infrastructure/logging/Logger';

describe('RedisStreamEventPublisher', () => {
  let publisher: RedisStreamEventPublisher;
  let mockRedis: { xadd: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    // Get fresh mock instance
    mockRedis = {
      xadd: jest.fn().mockResolvedValue('1234567890-0'),
    };
    (RedisClient.getInstance as jest.Mock).mockReturnValue(mockRedis);
    publisher = new RedisStreamEventPublisher();
  });

  describe('publish', () => {
    it('should publish domain event to Redis stream', async () => {
      const mockEvent: DomainEvent = {
        eventId: 'event-123',
        eventName: 'IngredientsReserved',
        occurredAt: new Date('2025-01-01T00:00:00Z'),
        toPrimitives: () => ({
          plateId: 'plate-123',
          ingredients: { tomato: 2 },
        }),
        toJSON: () => ({
          eventId: 'event-123',
          eventName: 'IngredientsReserved',
        }),
      };

      await publisher.publish(mockEvent);

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:events:IngredientsReserved',
        '*',
        expect.objectContaining({
          eventId: 'event-123',
          eventName: 'IngredientsReserved',
          occurredAt: '2025-01-01T00:00:00.000Z',
          data: expect.any(String),
        })
      );
    });

    it('should log successful publish', async () => {
      const mockEvent: DomainEvent = {
        eventId: 'event-456',
        eventName: 'PurchaseCompleted',
        occurredAt: new Date(),
        toPrimitives: () => ({ purchaseId: 'purchase-123' }),
        toJSON: () => ({ eventId: 'event-456' }),
      };

      await publisher.publish(mockEvent);

      expect(logger.debug).toHaveBeenCalledWith(
        'Domain event published',
        expect.objectContaining({
          eventName: 'PurchaseCompleted',
          eventId: 'event-456',
          messageId: '1234567890-0',
        })
      );
    });

    it('should throw and log error on publish failure', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.xadd.mockRejectedValue(error);

      const mockEvent: DomainEvent = {
        eventId: 'event-789',
        eventName: 'IngredientsUnavailable',
        occurredAt: new Date(),
        toPrimitives: () => ({ reason: 'Out of stock' }),
        toJSON: () => ({ eventId: 'event-789' }),
      };

      await expect(publisher.publish(mockEvent)).rejects.toThrow('Redis connection failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to publish domain event',
        error,
        expect.objectContaining({
          eventName: 'IngredientsUnavailable',
          eventId: 'event-789',
        })
      );
    });
  });

  describe('publishAll', () => {
    it('should publish multiple events', async () => {
      const events: DomainEvent[] = [
        {
          eventId: 'event-1',
          eventName: 'Event1',
          occurredAt: new Date(),
          toPrimitives: () => ({ id: 1 }),
          toJSON: () => ({ eventId: 'event-1' }),
        },
        {
          eventId: 'event-2',
          eventName: 'Event2',
          occurredAt: new Date(),
          toPrimitives: () => ({ id: 2 }),
          toJSON: () => ({ eventId: 'event-2' }),
        },
        {
          eventId: 'event-3',
          eventName: 'Event3',
          occurredAt: new Date(),
          toPrimitives: () => ({ id: 3 }),
          toJSON: () => ({ eventId: 'event-3' }),
        },
      ];

      await publisher.publishAll(events);

      expect(mockRedis.xadd).toHaveBeenCalledTimes(3);
    });

    it('should handle empty events array', async () => {
      await publisher.publishAll([]);

      expect(mockRedis.xadd).not.toHaveBeenCalled();
    });
  });
});
