/**
 * Domain Event: PurchaseCompletedEvent
 * Emitted when a purchase from the farmers market is completed
 */
import { DomainEvent } from './DomainEvent';

export class PurchaseCompletedEvent extends DomainEvent {
  constructor(
    public readonly purchaseId: string,
    public readonly ingredientName: string,
    public readonly requestedQuantity: number,
    public readonly obtainedQuantity: number,
    public readonly success: boolean,
    public readonly plateId?: string,
    public readonly orderId?: string
  ) {
    super();
  }

  get eventName(): string {
    return 'warehouse.purchase.completed';
  }

  toPrimitives(): Record<string, unknown> {
    return {
      purchaseId: this.purchaseId,
      ingredientName: this.ingredientName,
      requestedQuantity: this.requestedQuantity,
      obtainedQuantity: this.obtainedQuantity,
      success: this.success,
      plateId: this.plateId,
      orderId: this.orderId,
    };
  }
}
