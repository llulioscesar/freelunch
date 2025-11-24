/**
 * Unit Tests: Ingredients Value Object
 */
import { Ingredients } from '../../../../src/domain/value-objects/Ingredients';

describe('Ingredients Value Object', () => {
  describe('Constructor', () => {
    it('should create Ingredients with valid data', () => {
      const data = { tomato: 2, onion: 1, cheese: 3 };
      const ingredients = new Ingredients(data);

      expect(ingredients.toPrimitives()).toEqual(data);
    });

    it('should throw error for empty ingredients', () => {
      expect(() => new Ingredients({}))
        .toThrow('Ingredients cannot be empty');
    });

    it('should throw error for negative quantities', () => {
      expect(() => new Ingredients({ tomato: -1 }))
        .toThrow('Ingredient quantities must be positive');
    });

    it('should throw error for zero quantities', () => {
      expect(() => new Ingredients({ tomato: 0 }))
        .toThrow('Ingredient quantities must be positive');
    });

    it('should throw error for invalid ingredient names', () => {
      expect(() => new Ingredients({ '': 1 }))
        .toThrow('Ingredient names cannot be empty');
    });
  });

  describe('getIngredientNames', () => {
    it('should return list of ingredient names', () => {
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });

      const names = ingredients.getIngredientNames();

      expect(names).toEqual(['tomato', 'onion']);
    });

    it('should return sorted ingredient names', () => {
      const ingredients = new Ingredients({ onion: 1, cheese: 2, tomato: 3 });

      const names = ingredients.getIngredientNames();

      expect(names).toEqual(['cheese', 'onion', 'tomato']);
    });
  });

  describe('getQuantity', () => {
    it('should return correct quantity for existing ingredient', () => {
      const ingredients = new Ingredients({ tomato: 5, onion: 2 });

      expect(ingredients.getQuantity('tomato')).toBe(5);
      expect(ingredients.getQuantity('onion')).toBe(2);
    });

    it('should return 0 for non-existing ingredient', () => {
      const ingredients = new Ingredients({ tomato: 5 });

      expect(ingredients.getQuantity('cheese')).toBe(0);
    });
  });

  describe('getTotalItems', () => {
    it('should return total quantity of all ingredients', () => {
      const ingredients = new Ingredients({ tomato: 2, onion: 3, cheese: 1 });

      expect(ingredients.getTotalItems()).toBe(6);
    });

    it('should return correct total for single ingredient', () => {
      const ingredients = new Ingredients({ tomato: 10 });

      expect(ingredients.getTotalItems()).toBe(10);
    });
  });

  describe('hasIngredient', () => {
    it('should return true for existing ingredient', () => {
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });

      expect(ingredients.hasIngredient('tomato')).toBe(true);
      expect(ingredients.hasIngredient('onion')).toBe(true);
    });

    it('should return false for non-existing ingredient', () => {
      const ingredients = new Ingredients({ tomato: 2 });

      expect(ingredients.hasIngredient('cheese')).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should be equal to another Ingredients with same data', () => {
      const ingredients1 = new Ingredients({ tomato: 2, onion: 1 });
      const ingredients2 = new Ingredients({ tomato: 2, onion: 1 });

      expect(ingredients1.equals(ingredients2)).toBe(true);
    });

    it('should be equal regardless of order', () => {
      const ingredients1 = new Ingredients({ tomato: 2, onion: 1 });
      const ingredients2 = new Ingredients({ onion: 1, tomato: 2 });

      expect(ingredients1.equals(ingredients2)).toBe(true);
    });

    it('should NOT be equal with different quantities', () => {
      const ingredients1 = new Ingredients({ tomato: 2, onion: 1 });
      const ingredients2 = new Ingredients({ tomato: 3, onion: 1 });

      expect(ingredients1.equals(ingredients2)).toBe(false);
    });

    it('should NOT be equal with different ingredients', () => {
      const ingredients1 = new Ingredients({ tomato: 2, onion: 1 });
      const ingredients2 = new Ingredients({ tomato: 2, cheese: 1 });

      expect(ingredients1.equals(ingredients2)).toBe(false);
    });
  });

  describe('toPrimitives', () => {
    it('should return plain object', () => {
      const data = { tomato: 2, onion: 1 };
      const ingredients = new Ingredients(data);

      const primitives = ingredients.toPrimitives();

      expect(primitives).toEqual(data);
      expect(typeof primitives).toBe('object');
    });
  });
});
