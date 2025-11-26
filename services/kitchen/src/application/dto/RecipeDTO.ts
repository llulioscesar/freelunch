/**
 * DTO: Recipe
 * Data Transfer Object for Recipe responses
 */

export interface RecipeDTO {
  id: string;
  name: string;
  description: string;
  ingredients: Record<string, number>;
  createdAt: string;
}

export interface GetRecipesResponseDTO {
  success: boolean;
  recipes: RecipeDTO[];
  total: number;
}
