/**
 * Repository Interface: InventoryRepository
 * Port for inventory persistence
 */
import { InventoryItem } from '../entities/InventoryItem';
import { IngredientName } from '../value-objects/IngredientName';
import { InventoryItemId } from '../value-objects/InventoryItemId';

export interface InventoryRepository {
  /**
   * Find an inventory item by ID
   */
  findById(id: InventoryItemId): Promise<InventoryItem | null>;

  /**
   * Find an inventory item by ingredient name
   */
  findByIngredientName(name: IngredientName): Promise<InventoryItem | null>;

  /**
   * Get all inventory items
   */
  findAll(): Promise<InventoryItem[]>;

  /**
   * Save an inventory item (create or update)
   */
  save(item: InventoryItem): Promise<void>;

  /**
   * Initialize inventory with default stock (5 units per ingredient)
   */
  initializeDefaultStock(): Promise<void>;

  /**
   * Get multiple inventory items by ingredient names
   */
  findByIngredientNames(names: IngredientName[]): Promise<InventoryItem[]>;

  /**
   * Check if all required ingredients are available
   */
  checkAvailability(
    requirements: Map<string, number>
  ): Promise<{ available: boolean; missing: Map<string, number> }>;
}
