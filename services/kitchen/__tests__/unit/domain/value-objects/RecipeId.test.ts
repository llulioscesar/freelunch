/**
 * Unit Tests: RecipeId Value Object
 */
import { RecipeId } from '../../../../src/domain/value-objects/RecipeId';

describe('RecipeId Value Object', () => {
  describe('Constructor', () => {
    it('should create a new RecipeId with auto-generated UUID', () => {
      const recipeId = new RecipeId();

      expect(recipeId.getValue()).toBeTruthy();
      expect(recipeId.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create RecipeId with provided value', () => {
      const id = 'recipe-123';
      const recipeId = new RecipeId(id);

      expect(recipeId.getValue()).toBe(id);
    });

    it('should throw error for empty id', () => {
      expect(() => new RecipeId(''))
        .toThrow('RecipeId cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new RecipeId('   '))
        .toThrow('RecipeId cannot be empty');
    });
  });

  describe('equals', () => {
    it('should be equal to another RecipeId with same value', () => {
      const id = 'recipe-abc';
      const recipeId1 = new RecipeId(id);
      const recipeId2 = new RecipeId(id);

      expect(recipeId1.equals(recipeId2)).toBe(true);
    });

    it('should NOT be equal to another RecipeId with different value', () => {
      const recipeId1 = new RecipeId('recipe-abc');
      const recipeId2 = new RecipeId('recipe-def');

      expect(recipeId1.equals(recipeId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const id = 'recipe-xyz';
      const recipeId = new RecipeId(id);

      expect(recipeId.toString()).toBe(id);
    });
  });
});
