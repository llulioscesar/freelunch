/**
 * Value Object: PlateId
 * Represents a unique identifier for a plate
 */
import { randomUUID } from 'crypto';

export class PlateId {
  private readonly value: string;

  constructor(value?: string) {
    if (value !== undefined) {
      this.validateFormat(value);
      this.value = value;
    } else {
      this.value = this.generateId();
    }
  }

  private validateFormat(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('PlateId cannot be empty');
    }
  }

  private generateId(): string {
    return randomUUID();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PlateId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
