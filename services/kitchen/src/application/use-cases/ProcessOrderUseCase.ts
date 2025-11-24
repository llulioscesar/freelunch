/**
 * Use Case: Process Order
 * Business logic for processing orders from Orders service
 */
import { Plate } from '../../domain/entities/Plate';
import { PlateId } from '../../domain/value-objects/PlateId';
import { OrderReference } from '../../domain/value-objects/OrderReference';
import { PlateRepository } from '../../domain/repositories/PlateRepository';
import { EventPublisher } from '../ports/out/EventPublisher';
import {
  ProcessOrderDTO,
  ProcessOrderResponseDTO,
} from '../dto/ProcessOrderDTO';
import { logger } from '../../infrastructure/logging/Logger';

export class ProcessOrderUseCase {
  constructor(
    private readonly plateRepository: PlateRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(dto: ProcessOrderDTO): Promise<ProcessOrderResponseDTO> {
    const startTime = Date.now();
    const useCaseName = 'ProcessOrder';

    logger.logUseCaseStart(useCaseName, {
      orderId: dto.orderId,
      itemsCount: dto.items.length,
    });

    try {
      // Validate input
      if (!dto.orderId || dto.items.length === 0) {
        throw new Error('Invalid order data');
      }

      const plates: Plate[] = [];

      // Create a Plate for each OrderItem
      for (const item of dto.items) {
        const plateId = new PlateId();
        const orderReference = new OrderReference(dto.orderId, item.itemId);

        const plate = new Plate(plateId, orderReference);

        // Save plate
        await this.plateRepository.save(plate);
        plates.push(plate);

        logger.info(`Plate created for order item`, {
          plateId: plateId.getValue(),
          orderItemId: item.itemId,
        });
      }

      logger.info(`Created ${plates.length} plates for order ${dto.orderId}`);

      const duration = Date.now() - startTime;
      logger.logUseCaseEnd(useCaseName, duration, {
        platesCreated: plates.length,
      });

      return {
        success: true,
        orderId: dto.orderId,
        platesCreated: plates.length,
        plates: plates.map((p) => ({
          plateId: p.getId().getValue(),
          orderItemId: p.getOrderReference().getOrderItemId(),
          status: p.getStatus().getValue(),
        })),
        message: `Created ${plates.length} plates for preparation`,
      };
    } catch (error: any) {
      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
