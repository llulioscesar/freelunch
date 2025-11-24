/**
 * Use Case: List Plates
 * Business logic for retrieving plates
 */
import { PlateRepository } from '../../domain/repositories/PlateRepository';
import { PlateStatusEnum } from '../../domain/value-objects/PlateStatus';
import { ListPlatesResponseDTO } from '../dto/PlateDTO';
import { logger } from '../../infrastructure/logging/Logger';

export interface ListPlatesInput {
  status?: PlateStatusEnum;
  orderId?: string;
  includeStats?: boolean;
}

export class ListPlatesUseCase {
  constructor(private readonly plateRepository: PlateRepository) {}

  async execute(input: ListPlatesInput = {}): Promise<ListPlatesResponseDTO> {
    const useCaseName = 'ListPlates';

    logger.logUseCaseStart(useCaseName, input);

    try {
      let plates;

      if (input.orderId) {
        plates = await this.plateRepository.findByOrderId(input.orderId);
      } else if (input.status) {
        plates = await this.plateRepository.findByStatus(input.status);
      } else {
        plates = await this.plateRepository.findAll();
      }

      let stats;
      if (input.includeStats) {
        stats = {
          pending: await this.plateRepository.countByStatus(PlateStatusEnum.PENDING),
          assigned: await this.plateRepository.countByStatus(PlateStatusEnum.ASSIGNED),
          requesting: await this.plateRepository.countByStatus(
            PlateStatusEnum.REQUESTING_INGREDIENTS
          ),
          cooking: await this.plateRepository.countByStatus(PlateStatusEnum.COOKING),
          ready: await this.plateRepository.countByStatus(PlateStatusEnum.READY),
          failed: await this.plateRepository.countByStatus(PlateStatusEnum.FAILED),
        };
      }

      logger.info(`Retrieved ${plates.length} plates`);

      return {
        success: true,
        plates: plates.map((plate) => ({
          id: plate.getId().getValue(),
          orderId: plate.getOrderReference().getOrderId(),
          orderItemId: plate.getOrderReference().getOrderItemId(),
          recipeId: plate.getRecipeId()?.getValue(),
          recipeName: plate.getRecipeName(),
          ingredients: plate.getIngredients()?.toPrimitives(),
          status: plate.getStatus().getValue(),
          createdAt: plate.getCreatedAt().toISOString(),
          assignedAt: plate.getAssignedAt()?.toISOString(),
          cookingAt: plate.getCookingAt()?.toISOString(),
          readyAt: plate.getReadyAt()?.toISOString(),
          failureReason: plate.getFailureReason(),
          retryCount: plate.getRetryCount(),
          preparationTime: plate.getPreparationTime(),
        })),
        total: plates.length,
        stats,
      };
    } catch (error: any) {
      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
