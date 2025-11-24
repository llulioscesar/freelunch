/**
 * Use Case: Assign Recipe
 * Business logic for assigning a random recipe to a plate
 */
import { PlateRepository } from '../../domain/repositories/PlateRepository';
import { RecipeRepository } from '../../domain/repositories/RecipeRepository';
import { EventPublisher } from '../ports/out/EventPublisher';
import { PlateId } from '../../domain/value-objects/PlateId';
import { logger } from '../../infrastructure/logging/Logger';

export interface AssignRecipeInput {
  plateId: string;
}

export interface AssignRecipeOutput {
  success: boolean;
  plateId: string;
  recipeId: string;
  recipeName: string;
  ingredients: Record<string, number>;
}

export class AssignRecipeUseCase {
  constructor(
    private readonly plateRepository: PlateRepository,
    private readonly recipeRepository: RecipeRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(input: AssignRecipeInput): Promise<AssignRecipeOutput> {
    const useCaseName = 'AssignRecipe';

    logger.logUseCaseStart(useCaseName, input);

    try {
      // Find plate
      const plate = await this.plateRepository.findById(new PlateId(input.plateId));
      if (!plate) {
        throw new Error(`Plate not found: ${input.plateId}`);
      }

      // Get random recipe
      const recipe = await this.recipeRepository.getRandomRecipe();
      if (!recipe) {
        throw new Error('No recipes available');
      }

      // Assign recipe to plate (domain logic)
      plate.assignRecipe(
        recipe.getId(),
        recipe.getName(),
        recipe.getIngredients()
      );

      // Save plate
      await this.plateRepository.save(plate);

      // Publish domain events
      const events = plate.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      plate.clearDomainEvents();

      logger.info(`Recipe assigned to plate`, {
        plateId: input.plateId,
        recipeId: recipe.getId().getValue(),
        recipeName: recipe.getName(),
      });

      return {
        success: true,
        plateId: input.plateId,
        recipeId: recipe.getId().getValue(),
        recipeName: recipe.getName(),
        ingredients: recipe.getIngredients().toPrimitives(),
      };
    } catch (error: any) {
      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
