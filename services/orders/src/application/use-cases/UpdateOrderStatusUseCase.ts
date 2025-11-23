/**
 * Use Case: Update Order Status
 * Business logic for updating order status
 */
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderId } from '../../domain/value-objects/OrderId';
import { OrderStatusEnum } from '../../domain/value-objects/OrderStatus';
import { EventPublisher } from '../ports/out/EventPublisher';

export interface UpdateOrderStatusDTO {
  orderId: string;
  status: string;
  completedAt?: string;
}

export interface UpdateOrderStatusResponseDTO {
  success: boolean;
  order?: {
    id: string;
    status: string;
    updatedAt: string;
  };
  error?: string;
}

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(dto: UpdateOrderStatusDTO): Promise<UpdateOrderStatusResponseDTO> {
    try {
      // Find the order
      const orderId = new OrderId(dto.orderId);
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // Update status using domain logic
      const newStatus = dto.status as OrderStatusEnum;
      order.updateStatus(newStatus);

      // Save the updated order
      await this.orderRepository.update(order);

      // Publish domain events
      const events = order.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      order.clearDomainEvents();

      console.log(`Order ${dto.orderId} status updated to: ${dto.status}`);

      return {
        success: true,
        order: {
          id: order.getId().getValue(),
          status: order.getStatus().getValue(),
          updatedAt: order.getUpdatedAt().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update order status',
      };
    }
  }
}