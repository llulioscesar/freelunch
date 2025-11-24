/**
 * Use Case: Get Recipes
 * Business logic for retrieving all recipes
 */
import { RecipeRepository } from '../../domain/repositories/RecipeRepository';
import { GetRecipesResponseDTO } from '../dto/RecipeDTO';
import { logger } from '../../infrastructure/logging/Logger';

export class GetRecipesUseCase {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async execute(): Promise<GetRecipesResponseDTO> {
    const useCaseName = 'GetRecipes';

    logger.logUseCaseStart(useCaseName);

    try {
      const recipes = await this.recipeRepository.findAll();

      logger.info(`Retrieved ${recipes.length} recipes`);

      return {
        success: true,
        recipes: recipes.map((recipe) => ({
          id: recipe.getId().getValue(),
          name: recipe.getName(),
          description: recipe.getDescription(),
          ingredients: recipe.getIngredients().toPrimitives(),
          createdAt: recipe.getCreatedAt().toISOString(),
        })),
        total: recipes.length,
      };
    } catch (error: any) {
      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
