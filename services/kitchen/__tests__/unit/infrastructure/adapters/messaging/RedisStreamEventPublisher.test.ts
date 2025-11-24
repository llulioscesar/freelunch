import { RedisStreamEventPublisher } from '../../../../../src/infrastructure/adapters/messaging/RedisStreamEventPublisher.js';
import { PlateAssignedEvent } from '../../../../../src/domain/events/PlateAssignedEvent.js';

// Mock RedisClient
const mockRedisInstance = {
  xadd: jest.fn(),
  pipeline: jest.fn(),
  xgroup: jest.fn(),
  call: jest.fn(),
};

jest.mock('../../../../../src/infrastructure/adapters/cache/RedisClient.js', () => ({
  RedisClient: {
    getInstance: jest.fn(() => mockRedisInstance),
  },
}));

describe('RedisStreamEventPublisher', () => {
  let publisher: RedisStreamEventPublisher;

  beforeEach(() => {
    jest.clearAllMocks();
    publisher = new RedisStreamEventPublisher();
  });

  describe('publish', () => {
    it('should publish event to Redis Stream', async () => {
      const event = new PlateAssignedEvent(
        'plate-123',
        'order-456',
        'item-789',
        'recipe-abc',
        'Tomato Salad',
        { tomato: 2 }
      );

      mockRedisInstance.xadd.mockResolvedValue('1234567890-0');

      await publisher.publish(event);

      expect(mockRedisInstance.xadd).toHaveBeenCalledWith(
        'stream:kitchen:events',
        '*',
        expect.objectContaining({
          eventType: 'kitchen.plate.assigned',
          eventId: expect.any(String),
          occurredOn: expect.any(String),
          payload: expect.any(String),
        })
      );
    });

    it('should throw error if publishing fails', async () => {
      const event = new PlateAssignedEvent(
        'plate-123',
        'order-456',
        'item-789',
        'recipe-abc',
        'Tomato Salad',
        { tomato: 2 }
      );

      mockRedisInstance.xadd.mockRejectedValue(new Error('Redis connection failed'));

      await expect(publisher.publish(event)).rejects.toThrow('Event publishing failed');
    });
  });

  describe('publishBatch', () => {
    it('should publish multiple events in a batch', async () => {
      const events = [
        new PlateAssignedEvent('plate-1', 'order-1', 'item-1', 'recipe-1', 'Recipe 1', { tomato: 2 }),
        new PlateAssignedEvent('plate-2', 'order-2', 'item-2', 'recipe-2', 'Recipe 2', { onion: 1 }),
      ];

      const mockPipeline = {
        xadd: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockRedisInstance.pipeline.mockReturnValue(mockPipeline);

      await publisher.publishBatch(events);

      expect(mockRedisInstance.pipeline).toHaveBeenCalled();
      expect(mockPipeline.xadd).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should do nothing if events array is empty', async () => {
      await publisher.publishBatch([]);

      expect(mockRedisInstance.pipeline).not.toHaveBeenCalled();
    });

    it('should throw error if batch publishing fails', async () => {
      const events = [
        new PlateAssignedEvent('plate-1', 'order-1', 'item-1', 'recipe-1', 'Recipe 1', { tomato: 2 }),
      ];

      const mockPipeline = {
        xadd: jest.fn(),
        exec: jest.fn().mockRejectedValue(new Error('Pipeline failed')),
      };

      mockRedisInstance.pipeline.mockReturnValue(mockPipeline);

      await expect(publisher.publishBatch(events)).rejects.toThrow(
        'Batch event publishing failed'
      );
    });
  });

  describe('ensureConsumerGroup', () => {
    it('should create consumer group', async () => {
      mockRedisInstance.xgroup.mockResolvedValue('OK');

      await publisher.ensureConsumerGroup('stream:test', 'test-group');

      expect(mockRedisInstance.xgroup).toHaveBeenCalledWith('stream:test', {
        type: 'CREATE',
        group: 'test-group',
        id: '$',
        options: { MKSTREAM: true },
      });
    });

    it('should handle BUSYGROUP error gracefully', async () => {
      mockRedisInstance.xgroup.mockRejectedValue(new Error('BUSYGROUP Consumer Group name already exists'));

      await expect(
        publisher.ensureConsumerGroup('stream:test', 'test-group')
      ).resolves.not.toThrow();
    });

    it('should throw other errors', async () => {
      mockRedisInstance.xgroup.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        publisher.ensureConsumerGroup('stream:test', 'test-group')
      ).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getStreamInfo', () => {
    it('should get stream info', async () => {
      const mockInfo = {
        length: 10,
        'first-entry': ['1234567890-0', ['field1', 'value1']],
      };

      mockRedisInstance.call.mockResolvedValue(mockInfo);

      const info = await publisher.getStreamInfo('stream:test');

      expect(info).toEqual(mockInfo);
      expect(mockRedisInstance.call).toHaveBeenCalledWith('XINFO', 'STREAM', 'stream:test');
    });

    it('should use default stream name if not provided', async () => {
      mockRedisInstance.call.mockResolvedValue({});

      await publisher.getStreamInfo();

      expect(mockRedisInstance.call).toHaveBeenCalledWith('XINFO', 'STREAM', 'stream:kitchen:events');
    });

    it('should return null if getting stream info fails', async () => {
      mockRedisInstance.call.mockRejectedValue(new Error('Stream does not exist'));

      const info = await publisher.getStreamInfo('stream:test');

      expect(info).toBeNull();
    });
  });
});
