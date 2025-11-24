/**
 * Value Object: Ingredients
 * Represents a collection of ingredients with quantities
 */

export type IngredientName =
  | 'tomato'
  | 'lemon'
  | 'potato'
  | 'rice'
  | 'ketchup'
  | 'lettuce'
  | 'onion'
  | 'cheese'
  | 'meat'
  | 'chicken';

export const VALID_INGREDIENTS: IngredientName[] = [
  'tomato',
  'lemon',
  'potato',
  'rice',
  'ketchup',
  'lettuce',
  'onion',
  'cheese',
  'meat',
  'chicken',
];

export class Ingredients {
  private readonly items: Map<string, number>;

  constructor(items: Record<string, number>) {
    this.items = new Map();
    this.validateAndSet(items);
  }

  private validateAndSet(items: Record<string, number>): void {
    if (Object.keys(items).length === 0) {
      throw new Error('Ingredients cannot be empty');
    }

    for (const [name, quantity] of Object.entries(items)) {
      this.validateIngredient(name, quantity);
      this.items.set(name.toLowerCase(), quantity);
    }
  }

  private validateIngredient(name: string, quantity: number): void {
    const normalizedName = name.toLowerCase();

    if (!VALID_INGREDIENTS.includes(normalizedName as IngredientName)) {
      throw new Error(
        `Invalid ingredient: ${name}. Must be one of: ${VALID_INGREDIENTS.join(', ')}`
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Quantity for ${name} must be a positive integer`);
    }
  }

  // Getters
  getItems(): Map<string, number> {
    return new Map(this.items);
  }

  getQuantity(ingredientName: string): number {
    return this.items.get(ingredientName.toLowerCase()) || 0;
  }

  hasIngredient(ingredientName: string): boolean {
    return this.items.has(ingredientName.toLowerCase());
  }

  getIngredientNames(): string[] {
    return Array.from(this.items.keys());
  }

  getTotalItems(): number {
    return Array.from(this.items.values()).reduce((sum, qty) => sum + qty, 0);
  }

  // Business Methods
  hasAtLeastOneFrom(names: string[]): boolean {
    return names.some((name) => this.hasIngredient(name));
  }

  // Serialization
  toJSON(): Record<string, number> {
    const obj: Record<string, number> = {};
    this.items.forEach((quantity, name) => {
      obj[name] = quantity;
    });
    return obj;
  }

  toPrimitives(): Record<string, number> {
    return this.toJSON();
  }

  static fromJSON(json: Record<string, number>): Ingredients {
    return new Ingredients(json);
  }

  equals(other: Ingredients): boolean {
    if (this.items.size !== other.items.size) return false;

    for (const [name, quantity] of this.items) {
      if (other.getQuantity(name) !== quantity) return false;
    }

    return true;
  }

  toString(): string {
    const items = Array.from(this.items.entries())
      .map(([name, qty]) => `${name}:${qty}`)
      .join(', ');
    return `Ingredients(${items})`;
  }
}
