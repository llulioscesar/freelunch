/**
 * Domain Event: IngredientsReservedEvent
 * Emitted when ingredients are successfully reserved for a plate
 */
import { DomainEvent } from './DomainEvent';

export class IngredientsReservedEvent extends DomainEvent {
  constructor(
    public readonly plateId: string,
    public readonly orderItemId: string,
    public readonly ingredients: Record<string, number>,
    public readonly reservedAt: Date = new Date()
  ) {
    super();
  }

  get eventName(): string {
    return 'warehouse.ingredients.reserved';
  }

  toPrimitives(): Record<string, unknown> {
    return {
      plateId: this.plateId,
      orderItemId: this.orderItemId,
      ingredients: this.ingredients,
      reservedAt: this.reservedAt.toISOString(),
    };
  }
}
