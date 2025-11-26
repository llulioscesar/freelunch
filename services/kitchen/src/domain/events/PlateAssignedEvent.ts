/**
 * Domain Event: PlateAssignedEvent
 * Emitted when a recipe is assigned to a plate
 */
import { DomainEvent } from './DomainEvent';

export class PlateAssignedEvent extends DomainEvent {
  constructor(
    public readonly plateId: string,
    public readonly orderId: string,
    public readonly orderItemId: string,
    public readonly recipeId: string,
    public readonly recipeName: string,
    public readonly ingredients: Record<string, number>
  ) {
    super();
  }

  get eventName(): string {
    return 'kitchen.plate.assigned';
  }

  toPrimitives(): any {
    return {
      plateId: this.plateId,
      orderId: this.orderId,
      orderItemId: this.orderItemId,
      recipeId: this.recipeId,
      recipeName: this.recipeName,
      ingredients: this.ingredients,
    };
  }
}
