import { IngredientName } from '../../../../src/domain/value-objects/IngredientName';

describe('IngredientName', () => {
  describe('constructor', () => {
    it('should create valid ingredient name', () => {
      const ingredient = new IngredientName('tomato');
      expect(ingredient.getValue()).toBe('tomato');
    });

    it('should normalize to lowercase', () => {
      const ingredient = new IngredientName('TOMATO');
      expect(ingredient.getValue()).toBe('tomato');
    });

    it('should trim whitespace', () => {
      const ingredient = new IngredientName('  tomato  ');
      expect(ingredient.getValue()).toBe('tomato');
    });

    it('should throw error for invalid ingredient', () => {
      expect(() => new IngredientName('invalid')).toThrow(
        'Invalid ingredient: invalid'
      );
    });

    it('should accept all valid ingredients', () => {
      const validIngredients = [
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

      validIngredients.forEach((name) => {
        const ingredient = new IngredientName(name);
        expect(ingredient.getValue()).toBe(name);
      });
    });
  });

  describe('equals', () => {
    it('should return true for same ingredient', () => {
      const ingredient1 = new IngredientName('tomato');
      const ingredient2 = new IngredientName('tomato');
      expect(ingredient1.equals(ingredient2)).toBe(true);
    });

    it('should return false for different ingredients', () => {
      const ingredient1 = new IngredientName('tomato');
      const ingredient2 = new IngredientName('cheese');
      expect(ingredient1.equals(ingredient2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return ingredient value as string', () => {
      const ingredient = new IngredientName('tomato');
      expect(ingredient.toString()).toBe('tomato');
    });
  });

  describe('isValid', () => {
    it('should return true for valid ingredient', () => {
      expect(IngredientName.isValid('tomato')).toBe(true);
    });

    it('should return false for invalid ingredient', () => {
      expect(IngredientName.isValid('invalid')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(IngredientName.isValid('TOMATO')).toBe(true);
    });
  });

  describe('getAllValidIngredients', () => {
    it('should return all 10 valid ingredients', () => {
      const ingredients = IngredientName.getAllValidIngredients();
      expect(ingredients).toHaveLength(10);
      expect(ingredients).toContain('tomato');
      expect(ingredients).toContain('chicken');
    });
  });
});
