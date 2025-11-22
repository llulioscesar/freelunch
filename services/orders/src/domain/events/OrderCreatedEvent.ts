/**
 * Domain Event: Order Created
 */
import { DomainEvent } from './DomainEvent';

export class OrderCreatedEvent extends DomainEvent {
  readonly quantity: number;
  readonly customerName: string;

  constructor(orderId: string, quantity: number, customerName: string) {
    super(orderId);
    this.quantity = quantity;
    this.customerName = customerName;
  }

  eventName(): string {
    return 'order.created';
  }

  toPrimitives(): any {
    return {
      event: 'ORDER_CREATED',
      orderId: this.aggregateId,
      quantity: this.quantity,
      customerName: this.customerName,
      timestamp: this.occurredOn.toISOString(),
    };
  }
}