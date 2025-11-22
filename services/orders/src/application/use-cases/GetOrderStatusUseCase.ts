/**
 * Use Case: Get Order Status
 * Business logic for retrieving order status
 */
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderId } from '../../domain/value-objects/OrderId';

export interface GetOrderStatusDTO {
  orderId: string;
}

export interface OrderStatusResponseDTO {
  success: boolean;
  order?: {
    id: string;
    status: string;
    quantity: number;
    customerName: string;
    notes?: string;
    createdAt: string;
    completedAt?: string;
    updatedAt: string;
  };
  error?: string;
}

export class GetOrderStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(dto: GetOrderStatusDTO): Promise<OrderStatusResponseDTO> {
    try {
      const orderId = new OrderId(dto.orderId);
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      return {
        success: true,
        order: {
          id: order.getId().getValue(),
          status: order.getStatus().getValue(),
          quantity: order.getQuantity().getValue(),
          customerName: order.getCustomerInfo().getName(),
          notes: order.getCustomerInfo().getNotes(),
          createdAt: order.getCreatedAt().toISOString(),
          completedAt: order.getCompletedAt()?.toISOString(),
          updatedAt: order.getUpdatedAt().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('Error getting order status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get order status',
      };
    }
  }
}