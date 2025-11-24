/**
 * Domain Event: PlateReadyEvent
 * Emitted when a plate is ready for delivery
 */
import { DomainEvent } from './DomainEvent';

export class PlateReadyEvent extends DomainEvent {
  constructor(
    public readonly plateId: string,
    public readonly orderId: string,
    public readonly orderItemId: string,
    public readonly recipeId: string,
    public readonly recipeName: string,
    public readonly readyAt: Date,
    public readonly preparationTimeSeconds: number
  ) {
    super();
  }

  get eventName(): string {
    return 'kitchen.plate.ready';
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
        readyAt: this.readyAt.toISOString(),
        preparationTimeSeconds: this.preparationTimeSeconds,
      },
    };
  }
}
