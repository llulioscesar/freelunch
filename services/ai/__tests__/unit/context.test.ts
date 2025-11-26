import { buildSystemContext } from '../../src/context';

// Mock all clients
jest.mock('../../src/clients/warehouse', () => ({
  getInventory: jest.fn(),
  getPurchaseStats: jest.fn(),
  getRecentPurchases: jest.fn(),
  getWarehouseStats: jest.fn(),
}));

jest.mock('../../src/clients/kitchen', () => ({
  getRecipes: jest.fn(),
  getKitchenStats: jest.fn(),
}));

jest.mock('../../src/clients/orders', () => ({
  getOrdersStats: jest.fn(),
}));

import { getInventory, getPurchaseStats, getRecentPurchases, getWarehouseStats } from '../../src/clients/warehouse';
import { getRecipes, getKitchenStats } from '../../src/clients/kitchen';
import { getOrdersStats } from '../../src/clients/orders';

describe('Context Builder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildSystemContext', () => {
    it('should fetch all data in parallel', async () => {
      (getInventory as jest.Mock).mockResolvedValue([
        { id: '1', ingredientName: 'tomato', quantity: 5 },
      ]);
      (getRecipes as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Pizza', ingredients: { cheese: 2 } },
      ]);
      (getPurchaseStats as jest.Mock).mockResolvedValue({
        total: 100,
        successful: 90,
        failed: 10,
      });
      (getRecentPurchases as jest.Mock).mockResolvedValue([
        { id: '1', ingredientName: 'tomato', obtainedQuantity: 5 },
      ]);
      (getOrdersStats as jest.Mock).mockResolvedValue(null);
      (getKitchenStats as jest.Mock).mockResolvedValue(null);
      (getWarehouseStats as jest.Mock).mockResolvedValue(null);

      const context = await buildSystemContext();

      expect(getInventory).toHaveBeenCalled();
      expect(getRecipes).toHaveBeenCalled();
      expect(getPurchaseStats).toHaveBeenCalled();
      expect(getRecentPurchases).toHaveBeenCalledWith(20);
      expect(getOrdersStats).toHaveBeenCalled();
      expect(getKitchenStats).toHaveBeenCalled();
      expect(getWarehouseStats).toHaveBeenCalled();

      expect(context.inventory).toHaveLength(1);
      expect(context.recipes).toHaveLength(1);
      expect(context.purchaseStats.total).toBe(100);
    });

    it('should extract failed purchases (obtainedQuantity = 0)', async () => {
      (getInventory as jest.Mock).mockResolvedValue([]);
      (getRecipes as jest.Mock).mockResolvedValue([]);
      (getPurchaseStats as jest.Mock).mockResolvedValue({
        total: 0,
        successful: 0,
        failed: 0,
      });
      (getRecentPurchases as jest.Mock).mockResolvedValue([
        { id: '1', ingredientName: 'tomato', obtainedQuantity: 0 },
        { id: '2', ingredientName: 'cheese', obtainedQuantity: 5 },
        { id: '3', ingredientName: 'tomato', obtainedQuantity: 0 },
      ]);
      (getOrdersStats as jest.Mock).mockResolvedValue(null);
      (getKitchenStats as jest.Mock).mockResolvedValue(null);
      (getWarehouseStats as jest.Mock).mockResolvedValue(null);

      const context = await buildSystemContext();

      expect(context.recentFailedPurchases).toEqual(['tomato']);
    });

    it('should deduplicate failed purchases', async () => {
      (getInventory as jest.Mock).mockResolvedValue([]);
      (getRecipes as jest.Mock).mockResolvedValue([]);
      (getPurchaseStats as jest.Mock).mockResolvedValue({
        total: 0,
        successful: 0,
        failed: 0,
      });
      (getRecentPurchases as jest.Mock).mockResolvedValue([
        { id: '1', ingredientName: 'tomato', obtainedQuantity: 0 },
        { id: '2', ingredientName: 'tomato', obtainedQuantity: 0 },
        { id: '3', ingredientName: 'cheese', obtainedQuantity: 0 },
      ]);
      (getOrdersStats as jest.Mock).mockResolvedValue(null);
      (getKitchenStats as jest.Mock).mockResolvedValue(null);
      (getWarehouseStats as jest.Mock).mockResolvedValue(null);

      const context = await buildSystemContext();

      expect(context.recentFailedPurchases).toEqual(['tomato', 'cheese']);
    });

    it('should include all stats when available', async () => {
      const mockOrdersStats = {
        orders: { total: 10, active: 3, completed: 5, failed: 1, cancelled: 1 },
        items: { total: 30, pending: 5, preparing: 8, ready: 7, delivered: 8, failed: 2 },
        summary: { activeOrders: 3, platesDelivered: 8, platesInProgress: 15 },
      };
      const mockKitchenStats = {
        plates: { total: 50, byStatus: { READY: 40, FAILED: 10 } },
        recipes: { mostPrepared: [], totalRecipes: 5 },
        failures: { total: 10, byReason: [] },
      };
      const mockWarehouseStats = {
        inventory: { total: 20, outOfStock: 2, lowStock: 3, lowStockItems: [] },
        purchases: { total: 100, successful: 90, failed: 10, pending: 0, successRate: 90 },
        failedPurchasesByIngredient: [],
      };

      (getInventory as jest.Mock).mockResolvedValue([]);
      (getRecipes as jest.Mock).mockResolvedValue([]);
      (getPurchaseStats as jest.Mock).mockResolvedValue({ total: 0, successful: 0, failed: 0 });
      (getRecentPurchases as jest.Mock).mockResolvedValue([]);
      (getOrdersStats as jest.Mock).mockResolvedValue(mockOrdersStats);
      (getKitchenStats as jest.Mock).mockResolvedValue(mockKitchenStats);
      (getWarehouseStats as jest.Mock).mockResolvedValue(mockWarehouseStats);

      const context = await buildSystemContext();

      expect(context.ordersStats).toEqual(mockOrdersStats);
      expect(context.kitchenStats).toEqual(mockKitchenStats);
      expect(context.warehouseStats).toEqual(mockWarehouseStats);
    });
  });
});
