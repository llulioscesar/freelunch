/**
 * Repository Interface: RecipeRepository
 * Port for Recipe persistence (Hexagonal Architecture)
 */
import { Recipe } from '../entities/Recipe';
import { RecipeId } from '../value-objects/RecipeId';

export interface RecipeRepository {
  /**
   * Save a recipe (create or update)
   */
  save(recipe: Recipe): Promise<void>;

  /**
   * Find a recipe by ID
   */
  findById(id: RecipeId): Promise<Recipe | null>;

  /**
   * Find a recipe by name
   */
  findByName(name: string): Promise<Recipe | null>;

  /**
   * Find all recipes
   */
  findAll(): Promise<Recipe[]>;

  /**
   * Get a random recipe from available recipes
   */
  getRandomRecipe(): Promise<Recipe>;

  /**
   * Delete a recipe by ID
   */
  delete(id: RecipeId): Promise<void>;

  /**
   * Count total recipes
   */
  count(): Promise<number>;
}
