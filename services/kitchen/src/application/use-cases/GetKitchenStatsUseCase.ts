/**
 * Use Case: Get Kitchen Stats
 * Business logic for retrieving kitchen statistics
 */
import { PlateRepository } from '../../domain/repositories/PlateRepository.js';
import { RecipeRepository } from '../../domain/repositories/RecipeRepository.js';
import { KitchenStatsDTO, GetKitchenStatsResponseDTO } from '../dto/StatsDTO.js';
import { logger } from '../../infrastructure/logging/Logger.js';

export class GetKitchenStatsUseCase {
  constructor(
    private readonly plateRepository: PlateRepository,
    private readonly recipeRepository: RecipeRepository
  ) {}

  async execute(): Promise<GetKitchenStatsResponseDTO> {
    const useCaseName = 'GetKitchenStats';

    logger.logUseCaseStart(useCaseName, {});

    try {
      // Fetch all stats in parallel
      const [
        totalPlates,
        byStatus,
        recipeStats,
        failureReasons,
        totalRecipes,
      ] = await Promise.all([
        this.plateRepository.count(),
        this.plateRepository.getCountsByStatus(),
        this.plateRepository.getRecipeStats(10),
        this.plateRepository.getFailureReasons(10),
        this.recipeRepository.count(),
      ]);

      // Calculate success rates for recipes
      const mostPrepared = recipeStats.map((r) => ({
        recipeName: r.recipeName,
        total: r.total,
        ready: r.ready,
        failed: r.failed,
        successRate: r.total > 0 ? Math.round((r.ready / r.total) * 100) : 0,
      }));

      const stats: KitchenStatsDTO = {
        plates: {
          total: totalPlates,
          byStatus,
        },
        recipes: {
          mostPrepared,
          totalRecipes,
        },
        failures: {
          total: byStatus['FAILED'] || 0,
          byReason: failureReasons,
        },
        generatedAt: new Date().toISOString(),
      };

      logger.info('Kitchen stats retrieved successfully');

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
