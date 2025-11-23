/**
 * Value Object: OrderId
 * Representa el identificador único de una orden
 */
export class OrderId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value || this.generate();
    this.validate();
  }

  private generate(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `ORD-${timestamp}-${randomStr}`.toUpperCase();
  }

  private validate(): void {
    if (!this.value) {
      throw new Error('OrderId cannot be empty');
    }

    if (!this.value.match(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/)) {
      throw new Error('Invalid OrderId format');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}