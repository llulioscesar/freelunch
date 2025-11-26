import { getOrdersStats, getActiveOrders } from '../../../src/clients/orders';

// Mock global fetch
global.fetch = jest.fn();

describe('Orders Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrdersStats', () => {
    it('should return orders stats', async () => {
      const mockStats = {
        orders: { total: 10, active: 3, completed: 5, failed: 1, cancelled: 1 },
        items: { total: 30, pending: 5, preparing: 8, ready: 7, delivered: 8, failed: 2 },
        summary: { activeOrders: 3, platesDelivered: 8, platesInProgress: 15 },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, stats: mockStats }),
      });

      const result = await getOrdersStats();
      expect(result).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/stats'));
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getOrdersStats();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should return null when stats not in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: false }),
      });

      const result = await getOrdersStats();
      expect(result).toBeNull();
    });
  });

  describe('getActiveOrders', () => {
    it('should return active orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          status: 'preparing',
          customerName: 'John Doe',
          quantity: 2,
          items: [
            { id: 'item-1', status: 'preparing', recipeName: 'Pizza' },
          ],
          progress: 50,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, data: mockOrders }),
      });

      const result = await getActiveOrders();
      expect(result).toEqual(mockOrders);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/orders?status=active&limit=20'));
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getActiveOrders();
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should return empty array when data not in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: false }),
      });

      const result = await getActiveOrders();
      expect(result).toEqual([]);
    });
  });
});
