/**
 * Value Object: IngredientName
 * Represents a valid ingredient name
 */

const VALID_INGREDIENTS = [
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
] as const;

export type ValidIngredient = (typeof VALID_INGREDIENTS)[number];

export class IngredientName {
  private readonly value: ValidIngredient;

  constructor(value: string) {
    const normalized = value.toLowerCase().trim() as ValidIngredient;

    if (!VALID_INGREDIENTS.includes(normalized)) {
      throw new Error(
        `Invalid ingredient: ${value}. Valid ingredients are: ${VALID_INGREDIENTS.join(', ')}`
      );
    }

    this.value = normalized;
  }

  getValue(): ValidIngredient {
    return this.value;
  }

  equals(other: IngredientName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static isValid(value: string): boolean {
    return VALID_INGREDIENTS.includes(value.toLowerCase().trim() as ValidIngredient);
  }

  static getAllValidIngredients(): readonly ValidIngredient[] {
    return VALID_INGREDIENTS;
  }
}
