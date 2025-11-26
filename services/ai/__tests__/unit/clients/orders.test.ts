import { getOrdersStats, getActiveOrders, searchOrders, getOrderById, getOrderHistory } from '../../../src/clients/orders';

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
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/list?status=active&limit=20'));
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

  describe('searchOrders', () => {
    it('should search orders by customer name', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'active', customerName: 'Juan', quantity: 2 },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, data: mockOrders }),
      });

      const result = await searchOrders({ customerName: 'Juan' });
      expect(result).toEqual(mockOrders);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('customerName=Juan'));
    });

    it('should search orders by status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, data: [] }),
      });

      await searchOrders({ status: 'completed' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('status=completed'));
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await searchOrders({ customerName: 'Test' });
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('getOrderById', () => {
    it('should return order details', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'active',
        customerName: 'Juan',
        quantity: 3,
        progress: 50,
        items: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, order: mockOrder }),
      });

      const result = await getOrderById('order-123');
      expect(result).toEqual(mockOrder);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/status?id=order-123'));
    });

    it('should return null when order not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: false, error: 'Not found' }),
      });

      const result = await getOrderById('invalid-id');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getOrderById('order-123');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getOrderHistory', () => {
    it('should return order history', async () => {
      const mockHistory = [
        { id: '1', orderItemId: 'item-1', fromStatus: 'pending', toStatus: 'preparing', changedAt: '2024-01-01' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, history: mockHistory }),
      });

      const result = await getOrderHistory('order-123');
      expect(result).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/history?orderId=order-123'));
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getOrderHistory('order-123');
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });
});
