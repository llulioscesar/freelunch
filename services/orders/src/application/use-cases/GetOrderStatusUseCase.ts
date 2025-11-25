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
    items?: Array<{
      id: string;
      orderId: string;
      status: string;
      recipeId?: string;
      recipeName?: string;
      createdAt: string;
      assignedAt?: string;
      preparedAt?: string;
      deliveredAt?: string;
      failureReason?: string;
    }>;
    totalItems?: number;
    completedItems?: number;
    pendingItems?: number;
    progress?: number;
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

      // Use toPrimitives() to get complete order data including items
      const orderData = order.toPrimitives();

      return {
        success: true,
        order: orderData,
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