// Inventory types
export interface InventoryItem {
  id: string;
  ingredientName: string;
  quantity: number;
}

// Recipe types
export interface Recipe {
  id: string;
  name: string;
  ingredients: Record<string, number>;
}

// Purchase types
export interface PurchaseStats {
  total: number;
  successful: number;
  failed: number;
}

export interface Purchase {
  id: string;
  ingredientName: string;
  requestedQuantity: number;
  obtainedQuantity: number;
  status: string;
  createdAt: string;
}

// Kitchen stats
export interface RecipeStats {
  recipeName: string;
  total: number;
  ready: number;
  failed: number;
  successRate: number;
}

export interface KitchenStats {
  plates: {
    total: number;
    byStatus: Record<string, number>;
  };
  recipes: {
    mostPrepared: RecipeStats[];
    totalRecipes: number;
  };
  failures: {
    total: number;
    byReason: { reason: string; count: number }[];
  };
}

// Orders stats
export interface OrdersStats {
  orders: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  items: {
    total: number;
    pending: number;
    preparing: number;
    ready: number;
    delivered: number;
    failed: number;
  };
  summary: {
    activeOrders: number;
    platesDelivered: number;
    platesInProgress: number;
  };
}

// Warehouse stats
export interface WarehouseStats {
  inventory: {
    total: number;
    outOfStock: number;
    lowStock: number;
    lowStockItems: { ingredientName: string; quantity: number }[];
  };
  purchases: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  failedPurchasesByIngredient: {
    ingredientName: string;
    failedCount: number;
    lastError: string | null;
  }[];
}

// AI Context
export interface SystemContext {
  inventory: InventoryItem[];
  recipes: Recipe[];
  purchaseStats: PurchaseStats;
  recentFailedPurchases: string[];
  ordersStats?: OrdersStats;
  kitchenStats?: KitchenStats;
  warehouseStats?: WarehouseStats;
}

// Recommendations response
export interface RecipeRecommendation {
  recipe: string;
  viability: number;
  reason: string;
}

export interface CriticalAlert {
  ingredient: string;
  urgency: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface RecommendationsResponse {
  recipeRanking: RecipeRecommendation[];
  criticalAlerts: CriticalAlert[];
  generatedAt: string;
}

// Chat types
export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
}
