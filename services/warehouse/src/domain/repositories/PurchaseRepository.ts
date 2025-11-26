/**
 * Repository Interface: PurchaseRepository
 * Port for purchase history persistence
 */
import { Purchase, PurchaseStatus } from '../entities/Purchase';
import { PurchaseId } from '../value-objects/PurchaseId';
import { IngredientName } from '../value-objects/IngredientName';

export interface PurchaseRepository {
  /**
   * Find a purchase by ID
   */
  findById(id: PurchaseId): Promise<Purchase | null>;

  /**
   * Get all purchases
   */
  findAll(): Promise<Purchase[]>;

  /**
   * Get purchases by status
   */
  findByStatus(status: PurchaseStatus): Promise<Purchase[]>;

  /**
   * Get purchases by ingredient name
   */
  findByIngredientName(name: IngredientName): Promise<Purchase[]>;

  /**
   * Get purchases by plate ID
   */
  findByPlateId(plateId: string): Promise<Purchase[]>;

  /**
   * Get recent purchases (last N)
   */
  findRecent(limit: number): Promise<Purchase[]>;

  /**
   * Get purchases with pagination
   */
  findPaginated(page: number, limit: number): Promise<{ purchases: Purchase[]; total: number }>;

  /**
   * Save a purchase (create or update)
   */
  save(purchase: Purchase): Promise<void>;

  /**
   * Count purchases by status
   */
  countByStatus(status: PurchaseStatus): Promise<number>;

  /**
   * Get global stats (total, successful, failed)
   */
  getStats(): Promise<{ total: number; successful: number; failed: number }>;

  /**
   * Get total quantity purchased by ingredient
   */
  getTotalPurchasedByIngredient(name: IngredientName): Promise<number>;
}
