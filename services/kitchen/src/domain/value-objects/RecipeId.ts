/**
 * Value Object: RecipeId
 * Represents a unique identifier for a recipe
 */
import { randomUUID } from 'crypto';

export class RecipeId {
  private readonly value: string;

  constructor(value?: string) {
    if (value) {
      this.validateFormat(value);
      this.value = value;
    } else {
      this.value = this.generateId();
    }
  }

  private validateFormat(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('RecipeId cannot be empty');
    }
  }

  private generateId(): string {
    return randomUUID();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RecipeId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
