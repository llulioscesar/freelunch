/**
 * Use Case: Request Ingredients
 * Business logic for requesting ingredients from Warehouse
 */
import { PlateRepository } from '../../domain/repositories/PlateRepository';
import { PlateId } from '../../domain/value-objects/PlateId';
import {
  WarehouseClient,
  IngredientsRequestPayload,
} from '../ports/out/WarehouseClient';
import { EventPublisher } from '../ports/out/EventPublisher';
import { logger } from '../../infrastructure/logging/Logger';

export interface RequestIngredientsInput {
  plateId: string;
}

export interface RequestIngredientsOutput {
  success: boolean;
  plateId: string;
  message: string;
}

export class RequestIngredientsUseCase {
  constructor(
    private readonly plateRepository: PlateRepository,
    private readonly warehouseClient: WarehouseClient,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(
    input: RequestIngredientsInput
  ): Promise<RequestIngredientsOutput> {
    const useCaseName = 'RequestIngredients';

    logger.logUseCaseStart(useCaseName, input);

    try {
      // Find plate
      const plate = await this.plateRepository.findById(
        new PlateId(input.plateId)
      );

      if (!plate) {
        throw new Error(`Plate not found: ${input.plateId}`);
      }

      // Validate plate can request ingredients
      if (!plate.canRequestIngredients()) {
        throw new Error(
          `Plate cannot request ingredients in current state: ${plate.getStatus().getValue()}`
        );
      }

      // Request ingredients from plate entity (domain logic)
      plate.requestIngredients();

      // Save plate
      await this.plateRepository.save(plate);

      // Publish domain events
      const events = plate.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      plate.clearDomainEvents();

      // Send request to Warehouse via Redis Streams
      const payload: IngredientsRequestPayload = {
        plateId: input.plateId,
        orderItemId: plate.getOrderReference().getOrderItemId(),
        recipeId: plate.getRecipeId()!.getValue(),
        recipeName: plate.getRecipeName()!,
        ingredients: plate.getIngredients()!.toPrimitives(),
        requestedAt: new Date().toISOString(),
      };

      await this.warehouseClient.requestIngredients(payload);

      logger.info('Ingredients requested from Warehouse', {
        plateId: input.plateId,
        recipeId: payload.recipeId,
        recipeName: payload.recipeName,
      });

      return {
        success: true,
        plateId: input.plateId,
        message: 'Ingredients request sent to Warehouse',
      };
    } catch (error: any) {
      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
