/**
 * DTO: Kitchen Stats
 * Data Transfer Object for kitchen statistics
 */

export interface RecipeStatsDTO {
  recipeName: string;
  total: number;
  ready: number;
  failed: number;
  successRate: number;
}

export interface FailureReasonDTO {
  reason: string;
  count: number;
}

export interface KitchenStatsDTO {
  plates: {
    total: number;
    byStatus: Record<string, number>;
  };
  recipes: {
    mostPrepared: RecipeStatsDTO[];
    totalRecipes: number;
  };
  failures: {
    total: number;
    byReason: FailureReasonDTO[];
  };
  generatedAt: string;
}

export interface GetKitchenStatsResponseDTO {
  success: boolean;
  data: KitchenStatsDTO;
}
