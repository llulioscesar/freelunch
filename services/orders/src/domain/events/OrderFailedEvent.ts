/**
 * Domain Event: Order Failed
 *
 * Emitted when an order fails during preparation due to errors or issues.
 */
import { DomainEvent } from './DomainEvent';

export class OrderFailedEvent extends DomainEvent {
  readonly failedAt: Date;
  readonly reason: string;
  readonly errorDetails?: string;
  readonly quantity: number;

  constructor(
    orderId: string,
    failedAt: Date,
    reason: string,
    quantity: number,
    errorDetails?: string
  ) {
    super(orderId);
    this.failedAt = failedAt;
    this.reason = reason;
    this.quantity = quantity;
    this.errorDetails = errorDetails;
  }

  eventName(): string {
    return 'order.failed';
  }

  toPrimitives(): any {
    return {
      event: 'ORDER_FAILED',
      orderId: this.aggregateId,
      failedAt: this.failedAt.toISOString(),
      reason: this.reason,
      errorDetails: this.errorDetails,
      quantity: this.quantity,
      timestamp: this.occurredOn.toISOString(),
    };
  }
}
