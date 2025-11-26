/**
 * DTO: Warehouse Stats
 * Data Transfer Object for warehouse statistics
 */

export interface InventoryStatsDTO {
  total: number;
  outOfStock: number;
  lowStock: number;
  lowStockItems: { ingredientName: string; quantity: number }[];
}

export interface PurchaseStatsDTO {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
}

export interface FailedPurchasesByIngredientDTO {
  ingredientName: string;
  failedCount: number;
  lastError: string | null;
}

export interface WarehouseStatsDTO {
  inventory: InventoryStatsDTO;
  purchases: PurchaseStatsDTO;
  failedPurchasesByIngredient: FailedPurchasesByIngredientDTO[];
  generatedAt: string;
}

export interface GetWarehouseStatsResponseDTO {
  success: boolean;
  data: WarehouseStatsDTO;
}
