/**
 * Unit Tests: Recipe Entity
 */
import { Recipe } from '../../../../src/domain/entities/Recipe';
import { RecipeId } from '../../../../src/domain/value-objects/RecipeId';
import { Ingredients } from '../../../../src/domain/value-objects/Ingredients';

describe('Recipe Entity', () => {
  describe('Constructor', () => {
    it('should create a valid Recipe', () => {
      const recipeId = new RecipeId();
      const name = 'Tomato Salad';
      const ingredients = new Ingredients({ tomato: 2, lettuce: 1 });

      const recipe = new Recipe(recipeId, name, ingredients);

      expect(recipe.getId()).toBe(recipeId);
      expect(recipe.getName()).toBe(name);
      expect(recipe.getIngredients()).toBe(ingredients);
    });

    it('should throw error for empty name', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      expect(() => new Recipe(recipeId, '', ingredients))
        .toThrow('Recipe name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      expect(() => new Recipe(recipeId, '   ', ingredients))
        .toThrow('Recipe name cannot be empty');
    });
  });

  describe('Getters', () => {
    it('should return correct ID', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      const recipe = new Recipe(recipeId, 'Test Recipe', ingredients);

      expect(recipe.getId()).toBe(recipeId);
    });

    it('should return correct name', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      const recipe = new Recipe(recipeId, 'Tomato Soup', ingredients);

      expect(recipe.getName()).toBe('Tomato Soup');
    });

    it('should return correct ingredients', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      expect(recipe.getIngredients()).toBe(ingredients);
    });
  });

  describe('requiresIngredient', () => {
    it('should return true for required ingredient', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      expect(recipe.requiresIngredient('tomato')).toBe(true);
      expect(recipe.requiresIngredient('onion')).toBe(true);
    });

    it('should return false for non-required ingredient', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      expect(recipe.requiresIngredient('cheese')).toBe(false);
    });
  });

  describe('getIngredientQuantity', () => {
    it('should return correct quantity for existing ingredient', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 3, onion: 2 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      expect(recipe.getIngredientQuantity('tomato')).toBe(3);
      expect(recipe.getIngredientQuantity('onion')).toBe(2);
    });

    it('should return 0 for non-existing ingredient', () => {
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 3 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      expect(recipe.getIngredientQuantity('cheese')).toBe(0);
    });
  });

  describe('fromPrimitives', () => {
    it('should reconstruct Recipe from primitives', () => {
      const primitives = {
        id: 'recipe-123',
        name: 'Pasta Carbonara',
        ingredients: { cheese: 2, meat: 1 },
      };

      const recipe = Recipe.fromPrimitives(primitives);

      expect(recipe.getId().getValue()).toBe('recipe-123');
      expect(recipe.getName()).toBe('Pasta Carbonara');
      expect(recipe.getIngredients().getQuantity('cheese')).toBe(2);
      expect(recipe.getIngredients().getQuantity('meat')).toBe(1);
    });
  });

  describe('toPrimitives', () => {
    it('should convert Recipe to primitives', () => {
      const recipeId = new RecipeId('recipe-456');
      const ingredients = new Ingredients({ tomato: 2, lettuce: 1 });
      const recipe = new Recipe(recipeId, 'Garden Salad', ingredients);

      const primitives = recipe.toPrimitives();

      expect(primitives.id).toBe('recipe-456');
      expect(primitives.name).toBe('Garden Salad');
      expect(primitives.ingredients).toEqual({ tomato: 2, lettuce: 1 });
    });
  });

  describe('Equality', () => {
    it('should be equal to another Recipe with same ID', () => {
      const recipeId = new RecipeId('recipe-123');
      const ingredients1 = new Ingredients({ tomato: 2 });
      const ingredients2 = new Ingredients({ tomato: 3 });

      const recipe1 = new Recipe(recipeId, 'Recipe A', ingredients1);
      const recipe2 = new Recipe(recipeId, 'Recipe B', ingredients2);

      expect(recipe1.equals(recipe2)).toBe(true);
    });

    it('should NOT be equal to another Recipe with different ID', () => {
      const recipeId1 = new RecipeId('recipe-123');
      const recipeId2 = new RecipeId('recipe-456');
      const ingredients = new Ingredients({ tomato: 2 });

      const recipe1 = new Recipe(recipeId1, 'Recipe', ingredients);
      const recipe2 = new Recipe(recipeId2, 'Recipe', ingredients);

      expect(recipe1.equals(recipe2)).toBe(false);
    });
  });
});
