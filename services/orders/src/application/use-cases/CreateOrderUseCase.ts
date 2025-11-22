/**
 * Use Case: Create Order
 * Business logic for creating a new order
 */
import { Order } from '../../domain/entities/Order';
import { OrderId } from '../../domain/value-objects/OrderId';
import { Quantity } from '../../domain/value-objects/Quantity';
import { CustomerInfo } from '../../domain/value-objects/CustomerInfo';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { EventPublisher } from '../ports/out/EventPublisher';
import { CreateOrderDTO, CreateOrderResponseDTO } from '../dto/CreateOrderDTO';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(dto: CreateOrderDTO): Promise<CreateOrderResponseDTO> {
    try {
      // Validate input data (application level validation)
      if (!dto.quantity || dto.quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Create value objects
      const orderId = new OrderId();
      const quantity = new Quantity(dto.quantity);
      const customerInfo = new CustomerInfo(dto.customerName, dto.notes);

      // Create domain entity
      const order = new Order(orderId, quantity, customerInfo);

      // Save to repository
      await this.orderRepository.save(order);

      // Publish domain events
      const events = order.getDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      // Clear domain events after publishing
      order.clearDomainEvents();

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
      console.error('Error creating order:', error);
      throw error;
    }
  }
}