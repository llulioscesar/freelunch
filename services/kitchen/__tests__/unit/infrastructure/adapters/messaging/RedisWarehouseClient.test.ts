import { RedisWarehouseClient } from '../../../../../src/infrastructure/adapters/messaging/RedisWarehouseClient.js';

// Mock RedisClient
const mockRedisInstance = {
  xadd: jest.fn(),
  xgroup: jest.fn(),
  xreadgroup: jest.fn(),
};

jest.mock('../../../../../src/infrastructure/adapters/cache/RedisClient.js', () => ({
  RedisClient: {
    getInstance: jest.fn(() => mockRedisInstance),
  },
}));

describe('RedisWarehouseClient', () => {
  let client: RedisWarehouseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new RedisWarehouseClient('test-consumer-123');
  });

  describe('requestIngredients', () => {
    it('should send ingredient request to warehouse stream', async () => {
      const payload = {
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-abc',
        recipeName: 'Tomato Salad',
        ingredients: { tomato: 2, onion: 1 },
        requestedAt: '2025-01-01T00:00:00.000Z',
      };

      mockRedisInstance.xadd.mockResolvedValue('1234567890-0');

      await client.requestIngredients(payload);

      expect(mockRedisInstance.xadd).toHaveBeenCalledWith(
        'stream:warehouse:requests',
        '*',
        expect.objectContaining({
          plateId: 'plate-123',
          orderItemId: 'item-456',
          recipeId: 'recipe-abc',
          recipeName: 'Tomato Salad',
          ingredients: JSON.stringify({ tomato: 2, onion: 1 }),
          requestedAt: '2025-01-01T00:00:00.000Z',
          requestedBy: 'kitchen-service',
        })
      );
    });

    it('should throw error if request fails', async () => {
      const payload = {
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-abc',
        recipeName: 'Tomato Salad',
        ingredients: { tomato: 2 },
        requestedAt: '2025-01-01T00:00:00.000Z',
      };

      const error = new Error('Redis connection failed');
      mockRedisInstance.xadd.mockRejectedValue(error);

      await expect(client.requestIngredients(payload)).rejects.toThrow(error);
    });
  });

  describe('initialize', () => {
    it('should create consumer group for warehouse responses', async () => {
      mockRedisInstance.xgroup.mockResolvedValue('OK');

      await client.initialize();

      expect(mockRedisInstance.xgroup).toHaveBeenCalledWith('stream:warehouse:responses', {
        type: 'CREATE',
        group: 'kitchen-service',
        id: '$',
        options: { MKSTREAM: true },
      });
    });

    it('should handle BUSYGROUP error gracefully', async () => {
      mockRedisInstance.xgroup.mockRejectedValue(new Error('BUSYGROUP Consumer Group name already exists'));

      await expect(client.initialize()).resolves.not.toThrow();
    });

    it('should throw other errors', async () => {
      const error = new Error('Redis connection failed');
      mockRedisInstance.xgroup.mockRejectedValue(error);

      await expect(client.initialize()).rejects.toThrow(error);
    });
  });

  describe('stopConsuming', () => {
    it('should stop consuming', async () => {
      await client.stopConsuming();

      // No assertions needed - just checking it doesn't throw
    });
  });
});
