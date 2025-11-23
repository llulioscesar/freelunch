/**
 * Value Object: Quantity
 * Representa la cantidad de platos en una orden
 */
export class Quantity {
  private readonly value: number;
  private static readonly MIN_VALUE = 1;
  private static readonly MAX_VALUE = 100;

  constructor(value: number) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!Number.isInteger(this.value)) {
      throw new Error('Quantity must be an integer');
    }

    if (this.value < Quantity.MIN_VALUE) {
      throw new Error(`Quantity must be at least ${Quantity.MIN_VALUE}`);
    }

    if (this.value > Quantity.MAX_VALUE) {
      throw new Error(`Quantity cannot exceed ${Quantity.MAX_VALUE}`);
    }
  }

  getValue(): number {
    return this.value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    return new Quantity(this.value - other.value);
  }

  multiply(factor: number): Quantity {
    return new Quantity(Math.floor(this.value * factor));
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  isGreaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  // Business logic
  calculateEstimatedPreparationTime(): number {
    const baseTime = 5; // 5 minutes base
    const perItemTime = 2; // 2 minutes per item
    return baseTime + (this.value * perItemTime);
  }

  requiresBulkProcessing(): boolean {
    return this.value > 10;
  }
}