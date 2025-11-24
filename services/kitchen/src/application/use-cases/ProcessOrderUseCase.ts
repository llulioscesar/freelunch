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
import { metricsService } from '../../infrastructure/metrics/MetricsService';

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

        // Record metrics
        metricsService.recordPlateCreated(dto.orderId);

        logger.info(`Plate created for order item`, {
          plateId: plateId.getValue(),
          orderItemId: item.itemId,
        });
      }

      logger.info(`Created ${plates.length} plates for order ${dto.orderId}`);

      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;

      // Record use case execution metrics
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, true);

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
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;

      // Record failed use case execution
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, false);

      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}
