// Mock Redis before imports
const mockRedis = {
  xgroup: jest.fn(),
  xreadgroup: jest.fn(),
  xack: jest.fn(),
  xpending: jest.fn(),
  xclaim: jest.fn(),
};

jest.mock('../../../../src/infrastructure/adapters/cache/RedisClient', () => ({
  RedisClient: {
    getInstance: jest.fn().mockReturnValue(mockRedis),
  },
}));

jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: {
    recordEventConsumed: jest.fn(),
    recordIngredientsAvailable: jest.fn(),
    recordIngredientsUnavailable: jest.fn(),
    recordPlateReady: jest.fn(),
    recordPlateFailed: jest.fn(),
  },
}));

import { WarehouseResponsesConsumer } from '../../../../src/infrastructure/consumers/WarehouseResponsesConsumer';
import { PlateId } from '../../../../src/domain/value-objects/PlateId';

describe('WarehouseResponsesConsumer', () => {
  let consumer: WarehouseResponsesConsumer;
  let mockPlateRepository: any;
  let mockEventPublisher: any;
  let mockPlate: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlate = {
      getId: jest.fn().mockReturnValue(new PlateId('plate-1')),
      getRecipeId: jest.fn().mockReturnValue({ getValue: () => 'recipe-1' }),
      getRecipeName: jest.fn().mockReturnValue('Test Recipe'),
      getAssignedAt: jest.fn().mockReturnValue(new Date()),
      getReadyAt: jest.fn().mockReturnValue(new Date()),
      startCooking: jest.fn(),
      markAsReady: jest.fn(),
      markAsFailed: jest.fn(),
      getDomainEvents: jest.fn().mockReturnValue([]),
      clearDomainEvents: jest.fn(),
    };

    mockPlateRepository = {
      findById: jest.fn().mockResolvedValue(mockPlate),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    consumer = new WarehouseResponsesConsumer(
      mockPlateRepository,
      mockEventPublisher,
      'test-consumer'
    );
  });

  describe('initialize', () => {
    it('should create consumer group successfully', async () => {
      mockRedis.xgroup.mockResolvedValue('OK');

      await consumer.initialize();

      expect(mockRedis.xgroup).toHaveBeenCalled();
    });

    it('should handle BUSYGROUP error gracefully', async () => {
      mockRedis.xgroup.mockRejectedValue(new Error('BUSYGROUP'));

      await consumer.initialize();

      expect(mockRedis.xgroup).toHaveBeenCalled();
    });

    it('should throw on other errors', async () => {
      mockRedis.xgroup.mockRejectedValue(new Error('Connection refused'));

      await expect(consumer.initialize()).rejects.toThrow('Connection refused');
    });
  });

  describe('start and stop', () => {
    it('should start consuming', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null);

      const startPromise = consumer.start();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await consumer.stop();

      await expect(startPromise).resolves.not.toThrow();
    });

    it('should warn if already running', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null);

      const startPromise = consumer.start();
      await new Promise((resolve) => setTimeout(resolve, 50));

      await consumer.start();

      await consumer.stop();
      await startPromise;
    });
  });

  describe('processBatch', () => {
    it('should return 0 when no messages', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null);

      const count = await consumer.processBatch(10);

      expect(count).toBe(0);
    });

    it('should return 0 when empty array', async () => {
      mockRedis.xreadgroup.mockResolvedValue([]);

      const count = await consumer.processBatch(10);

      expect(count).toBe(0);
    });

    it('should process successful ingredient response with unified format', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                eventType: 'ingredients.ready',
                payload: JSON.stringify({
                  data: {
                    plateId: 'plate-1',
                    orderItemId: 'item-1',
                    success: true,
                    ingredients: { tomato: 2, cheese: 1 },
                    processedAt: new Date().toISOString(),
                  },
                }),
              },
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
      expect(mockPlate.startCooking).toHaveBeenCalled();
      expect(mockPlate.markAsReady).toHaveBeenCalled();
      expect(mockPlateRepository.save).toHaveBeenCalled();
      expect(mockRedis.xack).toHaveBeenCalled();
    });

    it('should handle payload as already parsed object', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                eventType: 'ingredients.ready',
                payload: {
                  data: {
                    plateId: 'plate-1',
                    orderItemId: 'item-1',
                    success: true,
                    ingredients: { tomato: 2 },
                    processedAt: new Date().toISOString(),
                  },
                },
              },
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
    });

    it('should process unavailable ingredients response', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                eventType: 'ingredients.unavailable',
                payload: JSON.stringify({
                  data: {
                    plateId: 'plate-1',
                    orderItemId: 'item-1',
                    success: false,
                    ingredients: { tomato: 2 },
                    unavailableIngredients: ['tomato'],
                    message: 'Tomato out of stock',
                    processedAt: new Date().toISOString(),
                  },
                }),
              },
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
      expect(mockPlate.markAsFailed).toHaveBeenCalledWith('Tomato out of stock');
      expect(mockPlateRepository.save).toHaveBeenCalled();
    });

    it('should handle legacy flat format', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                plateId: 'plate-1',
                orderItemId: 'item-1',
                success: 'true',
                ingredients: '{"tomato": 2}',
                processedAt: new Date().toISOString(),
              },
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
      expect(mockPlate.startCooking).toHaveBeenCalled();
    });

    it('should handle fields as array format', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              [
                'plateId',
                'plate-1',
                'orderItemId',
                'item-1',
                'success',
                'true',
                'ingredients',
                '{"tomato": 2}',
                'processedAt',
                new Date().toISOString(),
              ],
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
    });

    it('should handle plate not found', async () => {
      mockPlateRepository.findById.mockResolvedValue(null);
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                payload: JSON.stringify({
                  data: {
                    plateId: 'non-existent',
                    orderItemId: 'item-1',
                    success: true,
                    ingredients: {},
                    processedAt: new Date().toISOString(),
                  },
                }),
              },
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
      expect(mockPlate.startCooking).not.toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                payload: JSON.stringify({
                  data: {
                    plateId: 'plate-1',
                    orderItemId: 'item-1',
                    success: true,
                    ingredients: {},
                    processedAt: new Date().toISOString(),
                  },
                }),
              },
            ],
          ],
        ],
      ]);
      mockPlateRepository.save.mockRejectedValue(new Error('DB Error'));

      await consumer.processBatch(10);

      // Error is caught and logged, but processing continues
      expect(mockPlateRepository.save).toHaveBeenCalled();
    });

    it('should handle xreadgroup errors', async () => {
      mockRedis.xreadgroup.mockRejectedValue(new Error('Redis error'));

      const count = await consumer.processBatch(10);

      expect(count).toBe(0);
    });

    it('should publish domain events on success', async () => {
      const mockEvent = { eventName: 'plate.ready' };
      mockPlate.getDomainEvents.mockReturnValue([mockEvent]);

      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                payload: JSON.stringify({
                  data: {
                    plateId: 'plate-1',
                    orderItemId: 'item-1',
                    success: true,
                    ingredients: {},
                    processedAt: new Date().toISOString(),
                  },
                }),
              },
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      await consumer.processBatch(10);

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(mockEvent);
      expect(mockPlate.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle unavailable ingredients without message', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:responses',
          [
            [
              'msg-1',
              {
                payload: JSON.stringify({
                  data: {
                    plateId: 'plate-1',
                    orderItemId: 'item-1',
                    success: false,
                    ingredients: {},
                    processedAt: new Date().toISOString(),
                  },
                }),
              },
            ],
          ],
        ],
      ]);
      mockRedis.xack.mockResolvedValue(1);

      await consumer.processBatch(10);

      expect(mockPlate.markAsFailed).toHaveBeenCalledWith('Ingredients unavailable from warehouse');
    });
  });

  describe('getPendingMessages', () => {
    it('should return pending messages', async () => {
      const pending = [{ id: 'msg-1', idleTime: 1000 }];
      mockRedis.xpending.mockResolvedValue(pending);

      const result = await consumer.getPendingMessages();

      expect(result).toEqual(pending);
    });

    it('should return empty array on error', async () => {
      mockRedis.xpending.mockRejectedValue(new Error('Redis error'));

      const result = await consumer.getPendingMessages();

      expect(result).toEqual([]);
    });
  });

  describe('claimStaleMessages', () => {
    it('should claim stale messages', async () => {
      mockRedis.xpending.mockResolvedValue([
        { id: 'msg-1', idleTime: 400000 },
        { id: 'msg-2', idleTime: 100000 },
      ]);
      mockRedis.xclaim.mockResolvedValue(['msg-1']);

      await consumer.claimStaleMessages();

      expect(mockRedis.xclaim).toHaveBeenCalledTimes(1);
    });

    it('should not claim if no pending messages', async () => {
      mockRedis.xpending.mockResolvedValue([]);

      await consumer.claimStaleMessages();

      expect(mockRedis.xclaim).not.toHaveBeenCalled();
    });

    it('should not claim if no stale messages', async () => {
      mockRedis.xpending.mockResolvedValue([{ id: 'msg-1', idleTime: 1000 }]);

      await consumer.claimStaleMessages();

      expect(mockRedis.xclaim).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedis.xpending.mockRejectedValue(new Error('Redis error'));

      await consumer.claimStaleMessages();

      // Should not throw
    });
  });
});
