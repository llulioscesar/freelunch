/**
 * Domain Event: IngredientsUnavailableEvent
 * Emitted when ingredients could not be obtained
 */
import { DomainEvent } from './DomainEvent';

export class IngredientsUnavailableEvent extends DomainEvent {
  constructor(
    public readonly plateId: string,
    public readonly orderItemId: string,
    public readonly requestedIngredients: Record<string, number>,
    public readonly unavailableIngredients: string[],
    public readonly reason: string
  ) {
    super();
  }

  get eventName(): string {
    return 'warehouse.ingredients.unavailable';
  }

  toPrimitives(): Record<string, unknown> {
    return {
      plateId: this.plateId,
      orderItemId: this.orderItemId,
      requestedIngredients: this.requestedIngredients,
      unavailableIngredients: this.unavailableIngredients,
      reason: this.reason,
    };
  }
}
