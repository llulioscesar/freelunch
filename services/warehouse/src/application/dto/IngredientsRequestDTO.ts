/**
 * DTO: IngredientsRequestDTO
 * Data transfer object for ingredient request from kitchen
 */
export interface IngredientsRequestDTO {
  plateId: string;
  orderItemId: string;
  recipeId: string;
  recipeName: string;
  ingredients: Record<string, number>;
  requestedAt: string;
}

export interface IngredientsResponseDTO {
  plateId: string;
  orderItemId: string;
  success: boolean;
  ingredients: Record<string, number>;
  availableIngredients?: Record<string, number>;
  unavailableIngredients?: string[];
  message?: string;
  processedAt: string;
}
