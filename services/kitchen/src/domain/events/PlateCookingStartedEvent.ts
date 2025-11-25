/**
 * Domain Event: PlateCookingStartedEvent
 * Emitted when a plate starts cooking after ingredients are reserved
 */
import { DomainEvent } from './DomainEvent';

export class PlateCookingStartedEvent extends DomainEvent {
  constructor(
    public readonly plateId: string,
    public readonly orderId: string,
    public readonly orderItemId: string,
    public readonly recipeId: string,
    public readonly recipeName: string,
    public readonly cookingStartedAt: Date
  ) {
    super();
  }

  get eventName(): string {
    return 'kitchen.plate.cooking';
  }

  toPrimitives(): any {
    return {
      plateId: this.plateId,
      orderId: this.orderId,
      orderItemId: this.orderItemId,
      recipeId: this.recipeId,
      recipeName: this.recipeName,
      cookingStartedAt: this.cookingStartedAt.toISOString(),
    };
  }
}
