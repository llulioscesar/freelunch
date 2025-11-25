/**
 * Repository Interface for Plate Status History
 * This is a PORT in hexagonal architecture
 */

export interface PlateStatusHistoryEntry {
  id: string;
  plateId: string;
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
  record(entry: Omit<PlateStatusHistoryEntry, 'id' | 'changedAt'>): Promise<PlateStatusHistoryEntry>;

  /**
   * Get history for a specific plate
   */
  findByPlateId(plateId: string): Promise<PlateStatusHistoryEntry[]>;

  /**
   * Get history for all plates in an order
   */
  findByOrderId(orderId: string): Promise<PlateStatusHistoryEntry[]>;

  /**
   * Get recent status changes (for monitoring/dashboard)
   */
  findRecent(limit?: number): Promise<PlateStatusHistoryEntry[]>;
}
