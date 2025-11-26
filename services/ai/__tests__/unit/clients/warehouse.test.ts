import { getInventory, getPurchaseStats, getRecentPurchases, getWarehouseStats } from '../../../src/clients/warehouse';

// Mock global fetch
global.fetch = jest.fn();

describe('Warehouse Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventory', () => {
    it('should return inventory items', async () => {
      const mockItems = [
        { id: '1', ingredientName: 'tomato', quantity: 5 },
        { id: '2', ingredientName: 'cheese', quantity: 3 },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ data: { items: mockItems } }),
      });

      const result = await getInventory();
      expect(result).toEqual(mockItems);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/inventory'));
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getInventory();
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('getPurchaseStats', () => {
    it('should return purchase stats', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          data: { total: 100, successful: 90, failed: 10 },
        }),
      });

      const result = await getPurchaseStats();
      expect(result).toEqual({ total: 100, successful: 90, failed: 10 });
    });

    it('should return zero stats on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getPurchaseStats();
      expect(result).toEqual({ total: 0, successful: 0, failed: 0 });
      consoleSpy.mockRestore();
    });
  });

  describe('getRecentPurchases', () => {
    it('should return recent purchases', async () => {
      const mockPurchases = [
        { id: '1', ingredientName: 'tomato', obtainedQuantity: 5 },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ data: { purchases: mockPurchases } }),
      });

      const result = await getRecentPurchases(10);
      expect(result).toEqual(mockPurchases);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });

    it('should use default limit of 20', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ data: { purchases: [] } }),
      });

      await getRecentPurchases();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'));
    });
  });

  describe('getWarehouseStats', () => {
    it('should return warehouse stats', async () => {
      const mockStats = {
        inventory: { total: 20, outOfStock: 2, lowStock: 3, lowStockItems: [] },
        purchases: { total: 100, successful: 90, failed: 10, pending: 0, successRate: 90 },
        failedPurchasesByIngredient: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, data: mockStats }),
      });

      const result = await getWarehouseStats();
      expect(result).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/stats'));
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await getWarehouseStats();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
