/**
 * Value Object: OrderStatus
 * Representa los estados posibles de una orden
 */
export enum OrderStatusEnum {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  INGREDIENTS_REQUESTED = 'INGREDIENTS_REQUESTED',
  WAITING_FOR_INGREDIENTS = 'WAITING_FOR_INGREDIENTS',
  COOKING = 'COOKING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class OrderStatus {
  private readonly value: OrderStatusEnum;

  constructor(value: OrderStatusEnum) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!Object.values(OrderStatusEnum).includes(this.value)) {
      throw new Error(`Invalid order status: ${this.value}`);
    }
  }

  getValue(): OrderStatusEnum {
    return this.value;
  }

  equals(other: OrderStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Business logic: Can transition to next status?
  canTransitionTo(newStatus: OrderStatusEnum): boolean {
    const transitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
      [OrderStatusEnum.PENDING]: [
        OrderStatusEnum.PREPARING,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.PREPARING]: [
        OrderStatusEnum.INGREDIENTS_REQUESTED,
        OrderStatusEnum.FAILED,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.INGREDIENTS_REQUESTED]: [
        OrderStatusEnum.WAITING_FOR_INGREDIENTS,
        OrderStatusEnum.COOKING,
        OrderStatusEnum.FAILED,
      ],
      [OrderStatusEnum.WAITING_FOR_INGREDIENTS]: [
        OrderStatusEnum.COOKING,
        OrderStatusEnum.FAILED,
      ],
      [OrderStatusEnum.COOKING]: [
        OrderStatusEnum.READY,
        OrderStatusEnum.FAILED,
      ],
      [OrderStatusEnum.READY]: [
        OrderStatusEnum.DELIVERED,
      ],
      [OrderStatusEnum.DELIVERED]: [],
      [OrderStatusEnum.FAILED]: [],
      [OrderStatusEnum.CANCELLED]: [],
    };

    return transitions[this.value].includes(newStatus);
  }

  isPending(): boolean {
    return this.value === OrderStatusEnum.PENDING;
  }

  isFinal(): boolean {
    return [
      OrderStatusEnum.DELIVERED,
      OrderStatusEnum.FAILED,
      OrderStatusEnum.CANCELLED,
    ].includes(this.value);
  }
}