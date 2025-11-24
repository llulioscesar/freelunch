/**
 * Entity: Recipe
 * Represents a recipe with its ingredients
 */
import { RecipeId } from '../value-objects/RecipeId';
import { Ingredients } from '../value-objects/Ingredients';

export class Recipe {
  private readonly id: RecipeId;
  private readonly name: string;
  private readonly description: string;
  private readonly ingredients: Ingredients;
  private readonly createdAt: Date;

  constructor(
    id: RecipeId,
    name: string,
    ingredients: Ingredients,
    description?: string,
    createdAt?: Date
  ) {
    this.validateName(name);

    this.id = id;
    this.name = name;
    this.description = description || '';
    this.ingredients = ingredients;
    this.createdAt = createdAt || new Date();
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Recipe name cannot be empty');
    }

    if (name.length > 100) {
      throw new Error('Recipe name is too long (max 100 characters)');
    }
  }

  // Getters
  getId(): RecipeId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getIngredients(): Ingredients {
    return this.ingredients;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business Methods
  getRequiredIngredients(): Map<string, number> {
    return this.ingredients.getItems();
  }

  hasIngredient(ingredientName: string): boolean {
    return this.ingredients.hasIngredient(ingredientName);
  }

  getIngredientQuantity(ingredientName: string): number {
    return this.ingredients.getQuantity(ingredientName);
  }

  getTotalIngredients(): number {
    return this.ingredients.getTotalItems();
  }

  // Business Rules
  isValid(): boolean {
    return (
      this.name.length > 0 &&
      this.ingredients.getIngredientNames().length > 0
    );
  }

  // Serialization
  toPrimitives(): any {
    return {
      id: this.id.getValue(),
      name: this.name,
      description: this.description,
      ingredients: this.ingredients.toPrimitives(),
      createdAt: this.createdAt.toISOString(),
    };
  }

  static fromPrimitives(data: any): Recipe {
    return new Recipe(
      new RecipeId(data.id),
      data.name,
      Ingredients.fromJSON(data.ingredients),
      data.description,
      new Date(data.createdAt)
    );
  }

  equals(other: Recipe): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `Recipe(${this.name})`;
  }
}
