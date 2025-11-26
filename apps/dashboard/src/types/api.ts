// Orders API Types
export interface OrderItem {
  id: string;
  orderId: string;
  recipeId?: string;
  recipeName?: string;
  status: OrderItemStatus;
  createdAt: string;
  assignedAt?: string;
  preparedAt?: string;
  deliveredAt?: string;
  failureReason?: string;
}

export type OrderItemStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PREPARING'
  | 'INGREDIENTS_REQUESTED'
  | 'COOKING'
  | 'READY'
  | 'DELIVERED'
  | 'FAILED';

export interface Order {
  id: string;
  status: string;
  quantity: number;
  customerName: string;
  notes?: string;
  items: OrderItem[];
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  progress: number;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface OrderStats {
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

// Kitchen API Types
export interface Recipe {
  id: string;
  name: string;
  ingredients: Record<string, number>;
}

// Warehouse API Types
export interface InventoryItem {
  id: string;
  ingredientName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  ingredientName: string;
  requestedQuantity: number;
  obtainedQuantity: number;
  status: 'pending' | 'completed' | 'failed';
  plateId?: string;
  orderId?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PurchaseHistory {
  purchases: Purchase[];
  total: number;
  successful: number;
  failed: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Status History Types
export interface StatusHistoryEntry {
  id: string;
  orderItemId: string;
  fromStatus: string | null;
  toStatus: string;
  recipeId?: string;
  recipeName?: string;
  reason?: string;
  changedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  stats: OrderStats;
}

export interface OrderListItem {
  id: string;
  status: string;
  quantity: number;
  customerName: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrdersResponse {
  success: boolean;
  data: OrderListItem[];
  pagination: Pagination;
}

export interface RecipesResponse {
  success: boolean;
  recipes: Recipe[];
}

// AI Service Types
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

export interface AIRecommendations {
  recipeRanking: RecipeRecommendation[];
  criticalAlerts: CriticalAlert[];
  generatedAt: string;
}

export interface AIRecommendationsResponse {
  success: boolean;
  data: AIRecommendations;
  meta?: {
    duration: number;
    contextSize: {
      inventory: number;
      recipes: number;
    };
  };
}

export interface InventoryData {
  items: InventoryItem[];
  totalItems: number;
  lastUpdated: string;
}

export interface InventoryResponse {
  success: boolean;
  data: InventoryData;
}

export interface PurchasesResponse {
  success: boolean;
  data: PurchaseHistory;
}
