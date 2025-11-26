/**
 * Value Object: PurchaseId
 * Unique identifier for a market purchase
 */
import { randomUUID } from 'crypto';

export class PurchaseId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value || randomUUID();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PurchaseId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
