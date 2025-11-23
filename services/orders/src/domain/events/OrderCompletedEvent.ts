/**
 * Domain Event: Order Completed
 *
 * Emitted when an order has been successfully completed and delivered.
 */
import { DomainEvent } from './DomainEvent';

export class OrderCompletedEvent extends DomainEvent {
  readonly completedAt: Date;
  readonly preparationTimeMinutes: number;
  readonly quantity: number;

  constructor(
    orderId: string,
    completedAt: Date,
    preparationTimeMinutes: number,
    quantity: number
  ) {
    super(orderId);
    this.completedAt = completedAt;
    this.preparationTimeMinutes = preparationTimeMinutes;
    this.quantity = quantity;
  }

  eventName(): string {
    return 'order.completed';
  }

  toPrimitives(): any {
    return {
      event: 'ORDER_COMPLETED',
      orderId: this.aggregateId,
      completedAt: this.completedAt.toISOString(),
      preparationTimeMinutes: this.preparationTimeMinutes,
      quantity: this.quantity,
      timestamp: this.occurredOn.toISOString(),
    };
  }
}
