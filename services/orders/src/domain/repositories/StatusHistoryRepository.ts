/**
 * Repository Interface for Order Item Status History
 * This is a PORT in hexagonal architecture
 */

export interface StatusHistoryEntry {
  id: string;
  orderItemId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: Date;
  recipeId?: string;
  recipeName?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface StatusHistoryRepository {
  /**
   * Record a status change
   */
  record(entry: Omit<StatusHistoryEntry, 'id' | 'changedAt'>): Promise<StatusHistoryEntry>;

  /**
   * Get history for a specific order item
   */
  findByOrderItemId(orderItemId: string): Promise<StatusHistoryEntry[]>;

  /**
   * Get history for all items in an order
   */
  findByOrderId(orderId: string): Promise<StatusHistoryEntry[]>;

  /**
   * Get recent status changes (for monitoring/dashboard)
   */
  findRecent(limit?: number): Promise<StatusHistoryEntry[]>;
}
