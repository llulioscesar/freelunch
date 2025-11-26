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

import { OrderEventsConsumer } from '../../../../src/infrastructure/consumers/OrderEventsConsumer';

describe('OrderEventsConsumer', () => {
  let consumer: OrderEventsConsumer;
  let mockProcessOrderUseCase: any;
  let mockAssignRecipeUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProcessOrderUseCase = {
      execute: jest.fn().mockResolvedValue({
        platesCreated: 2,
        plates: [
          { plateId: 'plate-1', orderItemId: 'item-1' },
          { plateId: 'plate-2', orderItemId: 'item-2' },
        ],
      }),
    };

    mockAssignRecipeUseCase = {
      execute: jest.fn().mockResolvedValue({ success: true }),
    };

    consumer = new OrderEventsConsumer(
      mockProcessOrderUseCase,
      mockAssignRecipeUseCase,
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

      // Should not throw
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

      // Start consumer and stop it immediately
      const startPromise = consumer.start();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await consumer.stop();

      // Should complete without throwing
      await expect(startPromise).resolves.not.toThrow();
    });

    it('should warn if already running', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null);

      const startPromise = consumer.start();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Try to start again
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

    it('should process order.created events', async () => {
      mockRedis.xreadgroup
        .mockResolvedValueOnce(null) // No pending messages
        .mockResolvedValueOnce([
          [
            'stream:orders:events',
            [
              [
                'msg-1',
                {
                  eventType: 'order.created',
                  payload: JSON.stringify({
                    data: {
                      orderId: 'order-1',
                      quantity: 2,
                      customerName: 'Test Customer',
                      items: [
                        { itemId: 'item-1', orderId: 'order-1' },
                        { itemId: 'item-2', orderId: 'order-1' },
                      ],
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
      expect(mockProcessOrderUseCase.execute).toHaveBeenCalled();
      expect(mockAssignRecipeUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockRedis.xack).toHaveBeenCalled();
    });

    it('should handle payload as object', async () => {
      mockRedis.xreadgroup
        .mockResolvedValueOnce(null) // No pending messages
        .mockResolvedValueOnce([
          [
            'stream:orders:events',
            [
              [
                'msg-1',
                {
                  eventType: 'order.created',
                  payload: {
                    data: {
                      orderId: 'order-1',
                      quantity: 1,
                      customerName: 'Test',
                      items: [{ itemId: 'item-1', orderId: 'order-1' }],
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

    it('should handle fields as array format', async () => {
      mockRedis.xreadgroup
        .mockResolvedValueOnce(null) // No pending messages
        .mockResolvedValueOnce([
          [
            'stream:orders:events',
            [
              [
                'msg-1',
                [
                  'eventType',
                  'order.created',
                  'payload',
                  JSON.stringify({
                    data: {
                      orderId: 'order-1',
                      quantity: 1,
                      customerName: 'Test',
                      items: [{ itemId: 'item-1', orderId: 'order-1' }],
                    },
                  }),
                ],
              ],
            ],
          ],
        ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
    });

    it('should handle unknown event types', async () => {
      mockRedis.xreadgroup
        .mockResolvedValueOnce(null) // No pending messages
        .mockResolvedValueOnce([
          [
            'stream:orders:events',
            [['msg-1', { eventType: 'unknown.event', payload: '{}' }]],
          ],
        ]);
      mockRedis.xack.mockResolvedValue(1);

      const count = await consumer.processBatch(10);

      expect(count).toBe(1);
      expect(mockProcessOrderUseCase.execute).not.toHaveBeenCalled();
    });

    it('should continue processing after individual message errors', async () => {
      mockRedis.xreadgroup
        .mockResolvedValueOnce(null) // No pending messages
        .mockResolvedValueOnce([
          [
            'stream:orders:events',
            [
              [
                'msg-1',
                {
                  eventType: 'order.created',
                  payload: JSON.stringify({
                    data: {
                      orderId: 'order-1',
                      quantity: 1,
                      customerName: 'Test',
                      items: [{ itemId: 'item-1', orderId: 'order-1' }],
                    },
                  }),
                },
              ],
            ],
          ],
        ]);
      mockProcessOrderUseCase.execute.mockRejectedValue(new Error('DB Error'));

      await consumer.processBatch(10);

      // processMessage throws but batch continues, count still tracks attempt
      expect(mockProcessOrderUseCase.execute).toHaveBeenCalled();
    });

    it('should handle xreadgroup errors', async () => {
      mockRedis.xreadgroup.mockRejectedValue(new Error('Redis error'));

      const count = await consumer.processBatch(10);

      expect(count).toBe(0);
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
