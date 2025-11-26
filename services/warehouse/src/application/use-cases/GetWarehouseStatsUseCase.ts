/**
 * Use Case: Get Warehouse Stats
 * Business logic for retrieving warehouse statistics
 */
import { InventoryRepository } from '../../domain/repositories/InventoryRepository.js';
import { PurchaseRepository } from '../../domain/repositories/PurchaseRepository.js';
import { WarehouseStatsDTO, GetWarehouseStatsResponseDTO } from '../dto/StatsDTO.js';
import { logger } from '../../infrastructure/logging/Logger.js';

const LOW_STOCK_THRESHOLD = 2;

export class GetWarehouseStatsUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly purchaseRepository: PurchaseRepository
  ) {}

  async execute(): Promise<GetWarehouseStatsResponseDTO> {
    logger.debug('Getting warehouse stats');

    try {
      // Fetch all stats in parallel
      const [
        inventoryStats,
        purchaseCountsByStatus,
        failedByIngredient,
      ] = await Promise.all([
        this.inventoryRepository.getStats(LOW_STOCK_THRESHOLD),
        this.purchaseRepository.getCountsByStatus(),
        this.purchaseRepository.getFailedByIngredient(10),
      ]);

      // Calculate purchase totals
      let totalPurchases = 0;
      let successful = 0;
      let failed = 0;
      let pending = 0;

      Object.entries(purchaseCountsByStatus).forEach(([status, count]) => {
        totalPurchases += count;
        if (status === 'completed') {
          successful = count;
        } else if (status === 'failed') {
          failed = count;
        } else if (status === 'pending') {
          pending = count;
        }
      });

      const stats: WarehouseStatsDTO = {
        inventory: inventoryStats,
        purchases: {
          total: totalPurchases,
          successful,
          failed,
          pending,
          successRate: totalPurchases > 0 ? Math.round((successful / totalPurchases) * 100) : 0,
        },
        failedPurchasesByIngredient: failedByIngredient,
        generatedAt: new Date().toISOString(),
      };

      logger.info('Warehouse stats retrieved successfully');

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      logger.error('Failed to get warehouse stats', error);
      throw error;
    }
  }
}
