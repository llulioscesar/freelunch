import { KitchenRequestsConsumer } from '../../../../src/infrastructure/consumers/KitchenRequestsConsumer';
import { ProcessIngredientRequestUseCase } from '../../../../src/application/use-cases/ProcessIngredientRequestUseCase';
import { RedisClient } from '../../../../src/infrastructure/adapters/cache/RedisClient';

// Mock Redis Client
jest.mock('../../../../src/infrastructure/adapters/cache/RedisClient', () => ({
  RedisClient: {
    getInstance: jest.fn(),
  },
}));

describe('KitchenRequestsConsumer', () => {
  let consumer: KitchenRequestsConsumer;
  let mockUseCase: jest.Mocked<ProcessIngredientRequestUseCase>;
  let mockRedis: {
    xgroup: jest.Mock;
    xreadgroup: jest.Mock;
    xack: jest.Mock;
    xpending: jest.Mock;
    xclaim: jest.Mock;
  };

  beforeEach(() => {
    mockRedis = {
      xgroup: jest.fn(),
      xreadgroup: jest.fn(),
      xack: jest.fn(),
      xpending: jest.fn(),
      xclaim: jest.fn(),
    };

    (RedisClient.getInstance as jest.Mock).mockReturnValue(mockRedis);

    mockUseCase = {
      execute: jest.fn(),
    } as any;

    consumer = new KitchenRequestsConsumer(mockUseCase, 'test-consumer');
  });

  describe('initialize', () => {
    it('should create consumer group', async () => {
      mockRedis.xgroup.mockResolvedValue('OK');

      await consumer.initialize();

      expect(mockRedis.xgroup).toHaveBeenCalledWith(
        'stream:warehouse:requests',
        expect.objectContaining({
          type: 'CREATE',
          group: 'warehouse-service',
          id: '$',
        })
      );
    });

    it('should handle existing consumer group (BUSYGROUP)', async () => {
      const error = new Error('BUSYGROUP Consumer Group name already exists');
      mockRedis.xgroup.mockRejectedValue(error);

      // Should not throw
      await expect(consumer.initialize()).resolves.not.toThrow();
    });

    it('should throw for other errors', async () => {
      const error = new Error('Connection failed');
      mockRedis.xgroup.mockRejectedValue(error);

      await expect(consumer.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('processBatch', () => {
    it('should return 0 when no messages', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null);

      const result = await consumer.processBatch(10);

      expect(result).toBe(0);
    });

    it('should return 0 for empty messages array', async () => {
      mockRedis.xreadgroup.mockResolvedValue([]);

      const result = await consumer.processBatch(10);

      expect(result).toBe(0);
    });

    it('should process messages with new payload.data format', async () => {
      const payload = {
        data: {
          plateId: 'plate-123',
          orderItemId: 'item-456',
          recipeId: 'recipe-789',
          recipeName: 'Test Recipe',
          ingredients: [{ name: 'tomato', quantity: 2 }],
          requestedAt: new Date().toISOString(),
        },
      };

      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:requests',
          [
            [
              'message-id-1',
              {
                eventType: 'IngredientsRequested',
                payload: JSON.stringify(payload),
              },
            ],
          ],
        ],
      ]);

      mockUseCase.execute.mockResolvedValue({
        success: true,
        plateId: 'plate-123',
        orderItemId: 'item-456',
        processedIngredients: { tomato: 2 },
        unavailableIngredients: [],
        message: 'Success',
      });

      mockRedis.xack.mockResolvedValue(1);

      const result = await consumer.processBatch(10);

      expect(result).toBe(1);
      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          plateId: 'plate-123',
          orderItemId: 'item-456',
          ingredients: { tomato: 2 },
        })
      );
      expect(mockRedis.xack).toHaveBeenCalled();
    });

    it('should process messages with legacy flat format', async () => {
      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:requests',
          [
            [
              'message-id-1',
              {
                plateId: 'plate-123',
                orderItemId: 'item-456',
                recipeId: 'recipe-789',
                recipeName: 'Test Recipe',
                ingredients: JSON.stringify([{ name: 'cheese', quantity: 1 }]),
                requestedAt: new Date().toISOString(),
              },
            ],
          ],
        ],
      ]);

      mockUseCase.execute.mockResolvedValue({
        success: true,
        plateId: 'plate-123',
        orderItemId: 'item-456',
        processedIngredients: { cheese: 1 },
        unavailableIngredients: [],
        message: 'Success',
      });

      mockRedis.xack.mockResolvedValue(1);

      const result = await consumer.processBatch(10);

      expect(result).toBe(1);
      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: { cheese: 1 },
        })
      );
    });

    it('should handle processing errors gracefully', async () => {
      const payload = {
        data: {
          plateId: 'plate-123',
          orderItemId: 'item-456',
          recipeId: 'recipe-789',
          recipeName: 'Test Recipe',
          ingredients: [{ name: 'tomato', quantity: 2 }],
          requestedAt: new Date().toISOString(),
        },
      };

      mockRedis.xreadgroup.mockResolvedValue([
        [
          'stream:warehouse:requests',
          [
            [
              'message-id-1',
              {
                eventType: 'IngredientsRequested',
                payload: JSON.stringify(payload),
              },
            ],
          ],
        ],
      ]);

      mockUseCase.execute.mockRejectedValue(new Error('Processing failed'));

      // Should not throw, just log error and continue
      // processMessage catches errors internally, so processBatch still counts it
      const result = await consumer.processBatch(10);
      expect(result).toBe(1);

      // Message should NOT be acknowledged when processing fails
      expect(mockRedis.xack).not.toHaveBeenCalled();
    });
  });

  describe('getPendingMessages', () => {
    it('should return pending messages', async () => {
      const pending = [
        { id: 'msg-1', idleTime: 100 },
        { id: 'msg-2', idleTime: 200 },
      ];
      mockRedis.xpending.mockResolvedValue(pending);

      const result = await consumer.getPendingMessages();

      expect(result).toEqual(pending);
      expect(mockRedis.xpending).toHaveBeenCalledWith(
        'stream:warehouse:requests',
        'warehouse-service',
        '-',
        '+',
        100
      );
    });

    it('should return empty array on error', async () => {
      mockRedis.xpending.mockRejectedValue(new Error('Redis error'));

      const result = await consumer.getPendingMessages();

      expect(result).toEqual([]);
    });
  });

  describe('claimStaleMessages', () => {
    it('should claim messages older than 5 minutes', async () => {
      const pending = [
        { id: 'msg-1', idleTime: 400000 }, // > 5 minutes
        { id: 'msg-2', idleTime: 100000 }, // < 5 minutes
      ];
      mockRedis.xpending.mockResolvedValue(pending);
      mockRedis.xclaim.mockResolvedValue([]);

      const result = await consumer.claimStaleMessages();

      expect(result).toBe(1);
      expect(mockRedis.xclaim).toHaveBeenCalledTimes(1);
      expect(mockRedis.xclaim).toHaveBeenCalledWith(
        'stream:warehouse:requests',
        'warehouse-service',
        'test-consumer',
        300000,
        'msg-1'
      );
    });

    it('should return 0 when no pending messages', async () => {
      mockRedis.xpending.mockResolvedValue([]);

      const result = await consumer.claimStaleMessages();

      expect(result).toBe(0);
      expect(mockRedis.xclaim).not.toHaveBeenCalled();
    });

    it('should return 0 when no stale messages', async () => {
      const pending = [
        { id: 'msg-1', idleTime: 100000 }, // < 5 minutes
      ];
      mockRedis.xpending.mockResolvedValue(pending);

      const result = await consumer.claimStaleMessages();

      expect(result).toBe(0);
      expect(mockRedis.xclaim).not.toHaveBeenCalled();
    });
  });

  describe('start/stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(async () => {
      await consumer.stop();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should start consumer', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null);

      // Start returns immediately, loop runs in background
      const startPromise = consumer.start();

      // Stop to end the loop
      await consumer.stop();

      // Advance timers to let the loop complete
      jest.advanceTimersByTime(2000);

      await expect(startPromise).resolves.toBeUndefined();
    });

    it('should warn if already running', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null);

      // Start first time
      void consumer.start();

      // Try to start again - should just warn
      await consumer.start();

      // Stop
      await consumer.stop();
      jest.advanceTimersByTime(2000);
    });
  });
});
