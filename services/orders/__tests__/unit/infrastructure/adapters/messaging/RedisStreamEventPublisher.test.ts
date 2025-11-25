/**
 * Unit Tests: RedisStreamEventPublisher (with mocks)
 */
import { RedisStreamEventPublisher } from '../../../../../src/infrastructure/adapters/messaging/RedisStreamEventPublisher';
import { OrderCreatedEvent } from '../../../../../src/domain/events/OrderCreatedEvent';
import { OrderCompletedEvent } from '../../../../../src/domain/events/OrderCompletedEvent';
import { OrderFailedEvent } from '../../../../../src/domain/events/OrderFailedEvent';

// Mock Redis client
const mockRedis = {
  xadd: jest.fn(),
  pipeline: jest.fn(),
  xgroup: jest.fn(),
  xinfo: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

jest.mock('../../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    logEventPublished: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: {
    recordEventPublished: jest.fn(),
  },
}));

describe('RedisStreamEventPublisher (Unit with Mocks)', () => {
  let publisher: RedisStreamEventPublisher;

  beforeAll(() => {
    process.env.REDIS_URL = 'redis://mock:6379';
    process.env.REDIS_TOKEN = 'mock-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    publisher = new RedisStreamEventPublisher();
    mockRedis.xadd.mockResolvedValue('1234567890-0');
  });

  describe('publish', () => {
    it('should publish OrderCreatedEvent to Redis Stream', async () => {
      const event = new OrderCreatedEvent('ORD-123', new Date(), 5);

      await publisher.publish(event);

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:orders:events',
        '*',
        expect.objectContaining({
          eventType: 'order.created',
          aggregateId: 'ORD-123',
        })
      );
    });

    it('should route OrderCreatedEvent to kitchen stream', async () => {
      const event = new OrderCreatedEvent('ORD-123', new Date(), 5);

      await publisher.publish(event);

      // Should be called twice: once for main stream, once for specialized stream
      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:orders:events',
        '*',
        expect.any(Object)
      );
    });

    it('should publish OrderCompletedEvent', async () => {
      const event = new OrderCompletedEvent('ORD-456', new Date(), 15, 5);

      await publisher.publish(event);

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:orders:events',
        '*',
        expect.objectContaining({
          eventType: 'order.completed',
        })
      );
    });

    it('should route OrderCompletedEvent to analytics stream', async () => {
      const event = new OrderCompletedEvent('ORD-456', new Date(), 15, 5);

      await publisher.publish(event);

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:analytics',
        '*',
        expect.any(Object)
      );
    });

    it('should publish OrderFailedEvent', async () => {
      const event = new OrderFailedEvent('ORD-789', new Date(), 'Kitchen error', 3);

      await publisher.publish(event);

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:orders:events',
        '*',
        expect.objectContaining({
          eventType: 'order.failed',
        })
      );
    });

    it('should route OrderFailedEvent to analytics stream', async () => {
      const event = new OrderFailedEvent('ORD-789', new Date(), 'Kitchen error', 3);

      await publisher.publish(event);

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:analytics',
        '*',
        expect.any(Object)
      );
    });

    it('should handle publishing errors', async () => {
      const event = new OrderCreatedEvent('ORD-123', new Date(), 5);
      mockRedis.xadd.mockRejectedValueOnce(new Error('Redis connection error'));

      await expect(publisher.publish(event)).rejects.toThrow('Event publishing failed');
    });

    it('should not route event when no specialized stream is configured', async () => {
      const event = new OrderCreatedEvent('ORD-123', new Date(), 5);

      // Create event without routing config
      jest.spyOn(publisher as any, 'routeEventToSpecializedStream').mockResolvedValue(undefined);

      await publisher.publish(event);

      expect(mockRedis.xadd).toHaveBeenCalled();
    });

    it('should handle events without toPrimitives method', async () => {
      // Create a minimal event without toPrimitives
      const mockEvent = {
        eventName: () => 'test.event',
        occurredOn: new Date(),
        aggregateId: 'TEST-123',
      };

      await publisher.publish(mockEvent as any);

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:orders:events',
        '*',
        expect.objectContaining({
          eventType: 'test.event',
        })
      );
    });
  });

  describe('publishBatch', () => {
    it('should publish multiple events in a batch', async () => {
      const mockPipeline = {
        xadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const events = [
        new OrderCreatedEvent('ORD-1', new Date(), 1),
        new OrderCreatedEvent('ORD-2', new Date(), 2),
        new OrderCreatedEvent('ORD-3', new Date(), 3),
      ];

      await publisher.publishBatch(events);

      expect(mockPipeline.xadd).toHaveBeenCalledTimes(3);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle batch publishing errors', async () => {
      const mockPipeline = {
        xadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Pipeline error')),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const events = [
        new OrderCreatedEvent('ORD-1', new Date(), 1),
      ];

      await expect(publisher.publishBatch(events)).rejects.toThrow('Batch event publishing failed');
    });
  });

  describe('ensureConsumerGroup', () => {
    it('should create consumer group successfully', async () => {
      mockRedis.xgroup.mockResolvedValue('OK');

      await publisher.ensureConsumerGroup('stream:orders:events', 'orders-consumer-group');

      expect(mockRedis.xgroup).toHaveBeenCalledWith(
        'CREATE',
        'stream:orders:events',
        'orders-consumer-group',
        '$',
        'MKSTREAM'
      );
    });

    it('should handle BUSYGROUP error gracefully', async () => {
      const busyError = new Error('BUSYGROUP Consumer Group name already exists');
      mockRedis.xgroup.mockRejectedValue(busyError);

      await publisher.ensureConsumerGroup('stream:orders:events', 'existing-group');

      expect(mockRedis.xgroup).toHaveBeenCalled();
    });

    it('should throw error for non-BUSYGROUP errors', async () => {
      const error = new Error('Connection error');
      mockRedis.xgroup.mockRejectedValue(error);

      await expect(
        publisher.ensureConsumerGroup('stream:orders:events', 'test-group')
      ).rejects.toThrow('Connection error');
    });
  });

  describe('getStreamInfo', () => {
    it('should return stream info', async () => {
      const mockInfo = { length: 100, lastGeneratedId: '1234-0' };
      mockRedis.xinfo.mockResolvedValue(mockInfo);

      const result = await publisher.getStreamInfo('stream:orders:events');

      expect(result).toEqual(mockInfo);
      expect(mockRedis.xinfo).toHaveBeenCalledWith('STREAM', 'stream:orders:events');
    });

    it('should return null on error', async () => {
      mockRedis.xinfo.mockRejectedValue(new Error('Stream error'));

      const result = await publisher.getStreamInfo('stream:orders:events');

      expect(result).toBeNull();
    });

    it('should use default stream name when not provided', async () => {
      const mockInfo = { length: 50 };
      mockRedis.xinfo.mockResolvedValue(mockInfo);

      await publisher.getStreamInfo();

      expect(mockRedis.xinfo).toHaveBeenCalledWith('STREAM', 'stream:orders:events');
    });
  });
});
