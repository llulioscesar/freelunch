/**
 * Repository Interface: PlateRepository
 * Port for Plate persistence (Hexagonal Architecture)
 */
import { Plate } from '../entities/Plate';
import { PlateId } from '../value-objects/PlateId';
import { PlateStatusEnum } from '../value-objects/PlateStatus';

export interface PlateRepository {
  /**
   * Save a plate (create or update)
   */
  save(plate: Plate): Promise<void>;

  /**
   * Find a plate by ID
   */
  findById(id: PlateId): Promise<Plate | null>;

  /**
   * Find a plate by order item ID
   */
  findByOrderItemId(orderItemId: string): Promise<Plate | null>;

  /**
   * Find all plates for an order
   */
  findByOrderId(orderId: string): Promise<Plate[]>;

  /**
   * Find plates by status
   */
  findByStatus(status: PlateStatusEnum): Promise<Plate[]>;

  /**
   * Find all plates
   */
  findAll(): Promise<Plate[]>;

  /**
   * Find plates in progress (ASSIGNED, REQUESTING_INGREDIENTS, COOKING)
   */
  findInProgress(): Promise<Plate[]>;

  /**
   * Delete a plate by ID
   */
  delete(id: PlateId): Promise<void>;

  /**
   * Count plates by status
   */
  countByStatus(status: PlateStatusEnum): Promise<number>;

  /**
   * Count total plates
   */
  count(): Promise<number>;
}
