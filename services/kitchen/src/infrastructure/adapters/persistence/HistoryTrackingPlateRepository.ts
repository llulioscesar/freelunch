/**
 * Decorator: History Tracking Plate Repository
 * Kitchen Service
 *
 * Wraps a PlateRepository and automatically records status changes to history
 */
import { Plate } from '../../../domain/entities/Plate.js';
import { PlateId } from '../../../domain/value-objects/PlateId.js';
import { PlateStatusEnum } from '../../../domain/value-objects/PlateStatus.js';
import { PlateRepository } from '../../../domain/repositories/PlateRepository.js';
import { StatusHistoryRepository } from '../../../domain/repositories/StatusHistoryRepository.js';
import { logger } from '../../logging/Logger.js';

export class HistoryTrackingPlateRepository implements PlateRepository {
  constructor(
    private readonly delegate: PlateRepository,
    private readonly historyRepository: StatusHistoryRepository
  ) {}

  async save(plate: Plate): Promise<void> {
    const plateId = plate.getId().getValue();
    const newStatus = plate.getStatus().getValue();

    // Get current status before save
    let previousStatus: string | null = null;
    try {
      const existingPlate = await this.delegate.findById(plate.getId());
      if (existingPlate) {
        previousStatus = existingPlate.getStatus().getValue();
      }
    } catch (error) {
      // If we can't get the previous state, continue without it
      logger.debug('Could not get previous plate status for history', {
        plateId,
        error: (error as Error).message,
      });
    }

    // Save the plate
    await this.delegate.save(plate);

    // Record status change if different
    if (previousStatus !== newStatus) {
      try {
        const primitives = plate.toPrimitives();
        await this.historyRepository.record({
          plateId,
          fromStatus: previousStatus,
          toStatus: newStatus,
          recipeId: primitives.recipeId || undefined,
          recipeName: primitives.recipeName || undefined,
          reason: primitives.failureReason || undefined,
          metadata: primitives.ingredients ? { ingredients: primitives.ingredients } : undefined,
        });

        logger.debug('Plate status history recorded', {
          plateId,
          fromStatus: previousStatus,
          toStatus: newStatus,
        });
      } catch (historyError) {
        // Don't fail the main operation if history recording fails
        logger.warn('Failed to record plate status history', {
          plateId,
          error: (historyError as Error).message,
        });
      }
    }
  }

  // Delegate all other methods
  async findById(id: PlateId): Promise<Plate | null> {
    return this.delegate.findById(id);
  }

  async findByOrderItemId(orderItemId: string): Promise<Plate | null> {
    return this.delegate.findByOrderItemId(orderItemId);
  }

  async findByOrderId(orderId: string): Promise<Plate[]> {
    return this.delegate.findByOrderId(orderId);
  }

  async findByStatus(status: PlateStatusEnum): Promise<Plate[]> {
    return this.delegate.findByStatus(status);
  }

  async findAll(): Promise<Plate[]> {
    return this.delegate.findAll();
  }

  async findInProgress(): Promise<Plate[]> {
    return this.delegate.findInProgress();
  }

  async delete(id: PlateId): Promise<void> {
    return this.delegate.delete(id);
  }

  async countByStatus(status: PlateStatusEnum): Promise<number> {
    return this.delegate.countByStatus(status);
  }

  async count(): Promise<number> {
    return this.delegate.count();
  }

  async getCountsByStatus(): Promise<Record<string, number>> {
    return this.delegate.getCountsByStatus();
  }

  async getRecipeStats(limit?: number): Promise<{
    recipeName: string;
    total: number;
    ready: number;
    failed: number;
  }[]> {
    return this.delegate.getRecipeStats(limit);
  }

  async getFailureReasons(limit?: number): Promise<{
    reason: string;
    count: number;
  }[]> {
    return this.delegate.getFailureReasons(limit);
  }
}
