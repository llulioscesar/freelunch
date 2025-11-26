/**
 * Value Object: Quantity
 * Represents a non-negative quantity
 */
export class Quantity {
  private readonly value: number;

  constructor(value: number) {
    if (value < 0) {
      throw new Error('Quantity cannot be negative');
    }

    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be an integer');
    }

    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error('Cannot subtract: result would be negative');
    }
    return new Quantity(result);
  }

  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  isGreaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  static fromNumber(value: number): Quantity {
    return new Quantity(Math.floor(value));
  }
}
