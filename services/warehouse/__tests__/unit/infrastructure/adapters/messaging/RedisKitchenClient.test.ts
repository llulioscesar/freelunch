import { RedisKitchenClient } from '../../../../../src/infrastructure/adapters/messaging/RedisKitchenClient';
import { RedisClient } from '../../../../../src/infrastructure/adapters/cache/RedisClient';

// Mock Redis Client
jest.mock('../../../../../src/infrastructure/adapters/cache/RedisClient', () => ({
  RedisClient: {
    getInstance: jest.fn(),
  },
}));

describe('RedisKitchenClient', () => {
  let client: RedisKitchenClient;
  let mockRedis: {
    xadd: jest.Mock;
  };

  beforeEach(() => {
    mockRedis = {
      xadd: jest.fn().mockResolvedValue('message-id-123'),
    };

    (RedisClient.getInstance as jest.Mock).mockReturnValue(mockRedis);

    client = new RedisKitchenClient();
  });

  describe('sendIngredientsResponse', () => {
    it('should publish success response with payload.data wrapper', async () => {
      await client.sendIngredientsResponse({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        success: true,
        ingredients: { tomato: 2 },
        processedAt: '2024-01-01T00:00:00.000Z',
      });

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:warehouse:responses',
        '*',
        expect.objectContaining({
          eventType: 'IngredientsReady',
          aggregateId: 'plate-123',
          payload: expect.any(String),
        })
      );

      // Verify payload structure
      const call = mockRedis.xadd.mock.calls[0];
      const payload = JSON.parse(call[2].payload);
      expect(payload.data).toMatchObject({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        success: true,
        ingredients: { tomato: 2 },
      });
    });

    it('should publish failure response with IngredientsUnavailable event type', async () => {
      await client.sendIngredientsResponse({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        success: false,
        ingredients: { tomato: 2 },
        unavailableIngredients: ['tomato'],
        message: 'Ingredients not available',
        processedAt: '2024-01-01T00:00:00.000Z',
      });

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'stream:warehouse:responses',
        '*',
        expect.objectContaining({
          eventType: 'IngredientsUnavailable',
        })
      );

      // Verify payload includes unavailable ingredients
      const call = mockRedis.xadd.mock.calls[0];
      const payload = JSON.parse(call[2].payload);
      expect(payload.data.unavailableIngredients).toEqual(['tomato']);
      expect(payload.data.message).toBe('Ingredients not available');
    });

    it('should include optional fields when present', async () => {
      await client.sendIngredientsResponse({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        success: true,
        ingredients: { tomato: 2 },
        availableIngredients: { tomato: 2 },
        processedAt: '2024-01-01T00:00:00.000Z',
      });

      const call = mockRedis.xadd.mock.calls[0];
      const payload = JSON.parse(call[2].payload);
      expect(payload.data.availableIngredients).toEqual({ tomato: 2 });
    });

    it('should include eventId and occurredOn fields', async () => {
      await client.sendIngredientsResponse({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        success: true,
        ingredients: { tomato: 2 },
        processedAt: '2024-01-01T00:00:00.000Z',
      });

      const call = mockRedis.xadd.mock.calls[0];
      const messageData = call[2];

      expect(messageData.eventId).toBeDefined();
      expect(messageData.occurredOn).toBeDefined();
    });
  });
});
