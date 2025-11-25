/**
 * Value Object: InventoryItemId
 * Unique identifier for an inventory item
 */
import { randomUUID } from 'crypto';

export class InventoryItemId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value || randomUUID();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InventoryItemId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
