/**
 * Use Case: Create Order
 * Business logic for creating a new order
 */
import { Order } from '../../domain/entities/Order';
import { OrderId } from '../../domain/value-objects/OrderId';
import { Quantity } from '../../domain/value-objects/Quantity';
import { CustomerInfo } from '../../domain/value-objects/CustomerInfo';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { StatusHistoryRepository } from '../../domain/repositories/StatusHistoryRepository';
import { EventPublisher } from '../ports/out/EventPublisher';
import { CreateOrderDTO, CreateOrderResponseDTO } from '../dto/CreateOrderDTO';
import { logger } from '../../infrastructure/logging/Logger';
import { metricsService } from '../../infrastructure/metrics/MetricsService';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly statusHistoryRepository?: StatusHistoryRepository
  ) {}

  async execute(dto: CreateOrderDTO): Promise<CreateOrderResponseDTO> {
    const startTime = Date.now();
    const useCaseName = 'CreateOrder';

    logger.logUseCaseStart(useCaseName, {
      quantity: dto.quantity,
      customerName: dto.customerName,
    });

    try {
      // Validate input data (application level validation)
      if (!dto.quantity || dto.quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Create value objects
      const orderId = new OrderId();
      const quantity = new Quantity(dto.quantity);
      const customerInfo = new CustomerInfo(dto.customerName, dto.notes);

      logger.debug('Value objects created', {
        orderId: orderId.getValue(),
        quantity: dto.quantity,
      });

      // Create domain entity
      const order = new Order(orderId, quantity, customerInfo);

      // Save to repository
      await this.orderRepository.save(order);

      logger.logRepositoryOperation('save', 'Order', orderId.getValue());

      // Record initial status for all items in history
      if (this.statusHistoryRepository) {
        const items = order.getItems();
        for (const item of items) {
          try {
            await this.statusHistoryRepository.record({
              orderItemId: item.getId().getValue(),
              fromStatus: null, // Initial state
              toStatus: 'PENDING',
            });
          } catch (historyError) {
            logger.warn('Failed to record initial status history', {
              itemId: item.getId().getValue(),
              error: (historyError as Error).message,
            });
          }
        }
      }

      // Publish domain events
      const events = order.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      logger.info(`Published ${events.length} domain events`, {
        orderId: orderId.getValue(),
        eventCount: events.length,
      });

      // Clear domain events after publishing
      order.clearDomainEvents();

      const duration = Date.now() - startTime;
      logger.logUseCaseEnd(useCaseName, duration, {
        orderId: orderId.getValue(),
      });

      // Record metrics
      const durationSeconds = duration / 1000;
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, true);
      metricsService.recordOrderCreated(order.getQuantity().getValue());

      // Map to response DTO
      return {
        success: true,
        order: {
          id: order.getId().getValue(),
          quantity: order.getQuantity().getValue(),
          status: order.getStatus().getValue(),
          customerName: order.getCustomerInfo().getName(),
          createdAt: order.getCreatedAt().toISOString(),
        },
        message: 'Order created successfully and sent to kitchen',
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;
      metricsService.recordUseCaseExecution(useCaseName, durationSeconds, false);

      logger.logUseCaseError(useCaseName, error);
      throw error;
    }
  }
}