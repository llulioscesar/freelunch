/**
 * Domain Event: Order Created
 */
import { DomainEvent } from './DomainEvent';

export interface OrderItemData {
  itemId: string;
  orderId: string;
}

export class OrderCreatedEvent extends DomainEvent {
  readonly quantity: number;
  readonly customerName: string;
  readonly items: OrderItemData[];

  constructor(
    orderId: string,
    quantity: number,
    customerName: string,
    items: OrderItemData[]
  ) {
    super(orderId);
    this.quantity = quantity;
    this.customerName = customerName;
    this.items = items;
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
      items: this.items,
      timestamp: this.occurredOn.toISOString(),
    };
  }
}