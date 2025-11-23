/**
 * Value Object: CustomerInfo
 * Representa la información del cliente
 */
export class CustomerInfo {
  private readonly name: string;
  private readonly notes?: string;

  constructor(name?: string, notes?: string) {
    this.name = name || 'Anonymous';
    this.notes = notes;
    this.validate();
  }

  private validate(): void {
    if (this.name.length > 100) {
      throw new Error('Customer name cannot exceed 100 characters');
    }

    if (this.notes && this.notes.length > 500) {
      throw new Error('Notes cannot exceed 500 characters');
    }
  }

  getName(): string {
    return this.name;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  isAnonymous(): boolean {
    return this.name === 'Anonymous';
  }

  hasSpecialRequirements(): boolean {
    return !!this.notes && this.notes.length > 0;
  }

  equals(other: CustomerInfo): boolean {
    return this.name === other.name && this.notes === other.notes;
  }

  toString(): string {
    return this.notes
      ? `${this.name} (${this.notes})`
      : this.name;
  }
}