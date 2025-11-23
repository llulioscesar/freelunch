/**
 * Value Object: Order Item ID
 * Represents a unique identifier for an order item (individual dish)
 *
 * Format: ITEM-{timestamp}-{random}
 * Example: ITEM-1737542400-abc123
 */
export class OrderItemId {
  private readonly value: string;

  constructor(value?: string) {
    if (value) {
      this.validate(value);
      this.value = value;
    } else {
      this.value = this.generate();
    }
  }

  private generate(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ITEM-${timestamp}-${random}`;
  }

  private validate(value: string): void {
    const pattern = /^ITEM-\d+-[a-z0-9]+$/;
    if (!pattern.test(value)) {
      throw new Error(`Invalid OrderItemId format: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: OrderItemId): boolean {
    return this.value === other.value;
  }
}
