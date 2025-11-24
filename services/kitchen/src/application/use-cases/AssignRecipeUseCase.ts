/**
 * Use Case: Assign Recipe
 * Business logic for assigning a random recipe to a plate
 */
import { PlateRepository } from '../../domain/repositories/PlateRepository.js';
import { RecipeRepository } from '../../domain/repositories/RecipeRepository.js';
import { EventPublisher } from '../ports/out/EventPublisher.js';
import { WarehouseClient, IngredientsRequestPayload } from '../ports/out/WarehouseClient.js';
import { PlateId } from '../../domain/value-objects/PlateId.js';
import { logger } from '../../infrastructure/logging/Logger.js';
import { metricsService } from '../../infrastructure/metrics/MetricsService.js';

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
    private readonly eventPublisher: EventPublisher,
    private readonly warehouseClient: WarehouseClient
  ) {}

  async execute(input: AssignRecipeInput): Promise<AssignRecipeOutput> {
    const startTime = Date.now();
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

      // Publish domain events (PlateAssignedEvent)
      const events = plate.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      plate.clearDomainEvents();

      // Record metrics
      metricsService.recordPlateAssigned(
        recipe.getId().getValue(),
        recipe.getName()
      );
      metricsService.recordRecipeUsage(
        recipe.getId().getValue(),
        recipe.getName()
      );

      logger.info(`Recipe assigned to plate`, {
        plateId: input.plateId,
        recipeId: recipe.getId().getValue(),
        recipeName: recipe.getName(),
      });

      // Request ingredients from plate (domain logic)
      plate.requestIngredients();
      await this.plateRepository.save(plate);

      // Publish domain events (IngredientsRequestedEvent)
      const ingredientEvents = plate.getDomainEvents();
      for (const event of ingredientEvents) {
        await this.eventPublisher.publish(event);
      }
      plate.clearDomainEvents();

      // Send request to Warehouse via Redis Streams
      const payload: IngredientsRequestPayload = {
        plateId: input.plateId,
        orderItemId: plate.getOrderReference().getOrderItemId(),
        recipeId: recipe.getId().getValue(),
        recipeName: recipe.getName(),
        ingredients: recipe.getIngredients().toPrimitives(),
        requestedAt: new Date().toISOString(),
      };

      await this.warehouseClient.requestIngredients(payload);

      // Record ingredient request metrics
      metricsService.recordIngredientsRequested(
        input.plateId,
        recipe.getId().getValue(),
        Object.keys(recipe.getIngredients().toPrimitives()).length
      );

      logger.info('Ingredients requested from Warehouse', {
        plateId: input.plateId,
        recipeId: recipe.getId().getValue(),
        recipeName: recipe.getName(),
      });

      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;

      // Record use case execution metrics
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, true);

      return {
        success: true,
        plateId: input.plateId,
        recipeId: recipe.getId().getValue(),
        recipeName: recipe.getName(),
        ingredients: recipe.getIngredients().toPrimitives(),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;

      // Record failed use case execution
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, false);

      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
