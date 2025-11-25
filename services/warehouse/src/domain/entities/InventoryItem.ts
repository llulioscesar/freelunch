/**
 * Entity: InventoryItem
 * Represents an ingredient in the warehouse inventory
 */
import { InventoryItemId } from '../value-objects/InventoryItemId';
import { IngredientName, ValidIngredient } from '../value-objects/IngredientName';
import { Quantity } from '../value-objects/Quantity';

export class InventoryItem {
  private readonly id: InventoryItemId;
  private readonly ingredientName: IngredientName;
  private quantity: Quantity;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: InventoryItemId,
    ingredientName: IngredientName,
    quantity: Quantity,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id;
    this.ingredientName = ingredientName;
    this.quantity = quantity;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // Getters
  getId(): InventoryItemId {
    return this.id;
  }

  getIngredientName(): IngredientName {
    return this.ingredientName;
  }

  getQuantity(): Quantity {
    return this.quantity;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business Methods
  addStock(amount: Quantity): void {
    this.quantity = this.quantity.add(amount);
    this.updatedAt = new Date();
  }

  removeStock(amount: Quantity): void {
    if (!this.hasEnoughStock(amount)) {
      throw new Error(
        `Insufficient stock for ${this.ingredientName.getValue()}. ` +
          `Available: ${this.quantity.getValue()}, Requested: ${amount.getValue()}`
      );
    }
    this.quantity = this.quantity.subtract(amount);
    this.updatedAt = new Date();
  }

  hasEnoughStock(required: Quantity): boolean {
    return this.quantity.isGreaterThanOrEqual(required);
  }

  getMissingQuantity(required: Quantity): Quantity {
    if (this.hasEnoughStock(required)) {
      return Quantity.zero();
    }
    return new Quantity(required.getValue() - this.quantity.getValue());
  }

  // Serialization
  toPrimitives(): {
    id: string;
    ingredientName: ValidIngredient;
    quantity: number;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id.getValue(),
      ingredientName: this.ingredientName.getValue(),
      quantity: this.quantity.getValue(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromPrimitives(data: {
    id: string;
    ingredientName: string;
    quantity: number;
    createdAt?: string;
    updatedAt?: string;
  }): InventoryItem {
    return new InventoryItem(
      new InventoryItemId(data.id),
      new IngredientName(data.ingredientName),
      new Quantity(data.quantity),
      data.createdAt ? new Date(data.createdAt) : undefined,
      data.updatedAt ? new Date(data.updatedAt) : undefined
    );
  }

  // Factory method for initial stock
  static createWithInitialStock(
    ingredientName: string,
    initialQuantity: number = 5
  ): InventoryItem {
    return new InventoryItem(
      new InventoryItemId(),
      new IngredientName(ingredientName),
      new Quantity(initialQuantity)
    );
  }

  equals(other: InventoryItem): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `InventoryItem(${this.ingredientName.getValue()}: ${this.quantity.getValue()})`;
  }
}
