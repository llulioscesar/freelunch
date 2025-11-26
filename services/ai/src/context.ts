import { SystemContext } from './types';
import { getInventory, getPurchaseStats, getRecentPurchases, getWarehouseStats } from './clients/warehouse';
import { getRecipes, getKitchenStats } from './clients/kitchen';
import { getOrdersStats } from './clients/orders';

export async function buildSystemContext(): Promise<SystemContext> {
  // Fetch all data in parallel
  const [inventory, recipes, purchaseStats, recentPurchases, ordersStats, kitchenStats, warehouseStats] = await Promise.all([
    getInventory(),
    getRecipes(),
    getPurchaseStats(),
    getRecentPurchases(20),
    getOrdersStats(),
    getKitchenStats(),
    getWarehouseStats(),
  ]);

  // Extract ingredients with failed purchases (obtainedQuantity = 0)
  const recentFailedPurchases = recentPurchases
    .filter((p) => p.obtainedQuantity === 0)
    .map((p) => p.ingredientName)
    .filter((name, index, self) => self.indexOf(name) === index); // unique

  return {
    inventory,
    recipes,
    purchaseStats,
    recentFailedPurchases,
    ordersStats: ordersStats || undefined,
    kitchenStats: kitchenStats || undefined,
    warehouseStats: warehouseStats || undefined,
  };
}
