/**
 * Value Object: OrderReference
 * Represents a reference to an order from the Orders service
 */

export class OrderReference {
  private readonly orderId: string;
  private readonly orderItemId: string;

  constructor(orderId: string, orderItemId: string) {
    this.validateId(orderId, 'orderId');
    this.validateId(orderItemId, 'orderItemId');

    this.orderId = orderId;
    this.orderItemId = orderItemId;
  }

  private validateId(id: string, fieldName: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error(`${fieldName} cannot be empty`);
    }
  }

  getOrderId(): string {
    return this.orderId;
  }

  getOrderItemId(): string {
    return this.orderItemId;
  }

  equals(other: OrderReference): boolean {
    return (
      this.orderId === other.orderId &&
      this.orderItemId === other.orderItemId
    );
  }

  toString(): string {
    return `Order(${this.orderId}) Item(${this.orderItemId})`;
  }

  toPrimitives() {
    return {
      orderId: this.orderId,
      orderItemId: this.orderItemId,
    };
  }

  static fromPrimitives(data: {
    orderId: string;
    orderItemId: string;
  }): OrderReference {
    return new OrderReference(data.orderId, data.orderItemId);
  }
}
