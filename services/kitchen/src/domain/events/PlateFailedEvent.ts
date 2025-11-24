/**
 * Domain Event: PlateFailedEvent
 * Emitted when plate preparation fails
 */
import { DomainEvent } from './DomainEvent';

export class PlateFailedEvent extends DomainEvent {
  constructor(
    public readonly plateId: string,
    public readonly orderId: string,
    public readonly orderItemId: string,
    public readonly recipeId: string | undefined,
    public readonly recipeName: string | undefined,
    public readonly reason: string,
    public readonly failedAt: Date,
    public readonly retryCount: number
  ) {
    super();
  }

  get eventName(): string {
    return 'kitchen.plate.failed';
  }

  toPrimitives(): any {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredOn: this.occurredOn.toISOString(),
      data: {
        plateId: this.plateId,
        orderId: this.orderId,
        orderItemId: this.orderItemId,
        recipeId: this.recipeId,
        recipeName: this.recipeName,
        reason: this.reason,
        failedAt: this.failedAt.toISOString(),
        retryCount: this.retryCount,
      },
    };
  }
}
