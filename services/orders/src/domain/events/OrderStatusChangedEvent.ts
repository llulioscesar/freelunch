/**
 * Domain Event: Order Status Changed
 */
import { DomainEvent } from './DomainEvent';
import { OrderStatusEnum } from '../value-objects/OrderStatus';

export class OrderStatusChangedEvent extends DomainEvent {
  readonly previousStatus: OrderStatusEnum;
  readonly newStatus: OrderStatusEnum;

  constructor(
    orderId: string,
    previousStatus: OrderStatusEnum,
    newStatus: OrderStatusEnum
  ) {
    super(orderId);
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
  }

  eventName(): string {
    return 'order.status.changed';
  }

  toPrimitives(): any {
    return {
      event: 'ORDER_STATUS_CHANGED',
      orderId: this.aggregateId,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
      timestamp: this.occurredOn.toISOString(),
    };
  }
}