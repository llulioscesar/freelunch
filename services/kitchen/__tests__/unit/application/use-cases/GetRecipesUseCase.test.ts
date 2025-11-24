/**
 * Unit Tests: GetRecipesUseCase
 */
import { GetRecipesUseCase } from '../../../../src/application/use-cases/GetRecipesUseCase';
import { RecipeRepository } from '../../../../src/domain/repositories/RecipeRepository';
import { Recipe } from '../../../../src/domain/entities/Recipe';
import { RecipeId } from '../../../../src/domain/value-objects/RecipeId';
import { Ingredients } from '../../../../src/domain/value-objects/Ingredients';

describe('GetRecipesUseCase', () => {
  let useCase: GetRecipesUseCase;
  let mockRecipeRepository: jest.Mocked<RecipeRepository>;

  beforeEach(() => {
    mockRecipeRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      getRandomRecipe: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<RecipeRepository>;

    useCase = new GetRecipesUseCase(mockRecipeRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all recipes', async () => {
      const recipe1 = new Recipe(
        new RecipeId('recipe-1'),
        'Tomato Salad',
        new Ingredients({ tomato: 2, lettuce: 1 })
      );
      const recipe2 = new Recipe(
        new RecipeId('recipe-2'),
        'Chicken Soup',
        new Ingredients({ chicken: 1, onion: 2 })
      );

      mockRecipeRepository.findAll.mockResolvedValue([recipe1, recipe2]);

      const result = await useCase.execute();

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].name).toBe('Tomato Salad');
      expect(result.recipes[1].name).toBe('Chicken Soup');
    });

    it('should return empty array when no recipes exist', async () => {
      mockRecipeRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
      expect(result.recipes).toHaveLength(0);
    });

    it('should include recipe ingredients in response', async () => {
      const recipe = new Recipe(
        new RecipeId('recipe-1'),
        'Test Recipe',
        new Ingredients({ tomato: 3, cheese: 2 })
      );

      mockRecipeRepository.findAll.mockResolvedValue([recipe]);

      const result = await useCase.execute();

      expect(result.recipes[0].ingredients).toEqual({ tomato: 3, cheese: 2 });
    });

    it('should handle repository errors', async () => {
      mockRecipeRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute()).rejects.toThrow('Database error');
    });
  });
});
