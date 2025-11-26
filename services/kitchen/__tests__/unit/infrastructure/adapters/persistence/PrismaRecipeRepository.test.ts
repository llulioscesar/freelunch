import { PrismaRecipeRepository } from '../../../../../src/infrastructure/adapters/persistence/PrismaRecipeRepository.js';
import { Recipe } from '../../../../../src/domain/entities/Recipe.js';
import { RecipeId } from '../../../../../src/domain/value-objects/RecipeId.js';
import { Ingredients } from '../../../../../src/domain/value-objects/Ingredients.js';

describe('PrismaRecipeRepository', () => {
  let repository: PrismaRecipeRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      recipe: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    repository = new PrismaRecipeRepository(mockPrisma);
  });

  describe('save', () => {
    it('should save a new recipe', async () => {
      const recipeId = new RecipeId('recipe-123');
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });
      const recipe = new Recipe(recipeId, 'Tomato Salad', ingredients, 'Fresh salad');

      mockPrisma.recipe.upsert.mockResolvedValue({});

      await repository.save(recipe);

      expect(mockPrisma.recipe.upsert).toHaveBeenCalledWith({
        where: { id: 'recipe-123' },
        create: expect.objectContaining({
          id: 'recipe-123',
          name: 'Tomato Salad',
          description: 'Fresh salad',
          ingredients: { tomato: 2, onion: 1 },
        }),
        update: expect.any(Object),
      });
    });
  });

  describe('findById', () => {
    it('should find recipe by id', async () => {
      const recipeId = new RecipeId('recipe-123');

      mockPrisma.recipe.findUnique.mockResolvedValue({
        id: 'recipe-123',
        name: 'Tomato Salad',
        description: 'Fresh salad',
        ingredients: { tomato: 2, onion: 1 },
        createdAt: new Date('2025-01-01'),
      });

      const recipe = await repository.findById(recipeId);

      expect(recipe).not.toBeNull();
      expect(recipe?.getId().getValue()).toBe('recipe-123');
      expect(recipe?.getName()).toBe('Tomato Salad');
      expect(mockPrisma.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 'recipe-123' },
      });
    });

    it('should return null if recipe not found', async () => {
      const recipeId = new RecipeId('recipe-999');
      mockPrisma.recipe.findUnique.mockResolvedValue(null);

      const recipe = await repository.findById(recipeId);

      expect(recipe).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find recipe by name', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue({
        id: 'recipe-123',
        name: 'Tomato Salad',
        description: 'Fresh salad',
        ingredients: { tomato: 2, onion: 1 },
        createdAt: new Date('2025-01-01'),
      });

      const recipe = await repository.findByName('Tomato Salad');

      expect(recipe).not.toBeNull();
      expect(recipe?.getName()).toBe('Tomato Salad');
      expect(mockPrisma.recipe.findUnique).toHaveBeenCalledWith({
        where: { name: 'Tomato Salad' },
      });
    });

    it('should return null if recipe not found', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(null);

      const recipe = await repository.findByName('Unknown Recipe');

      expect(recipe).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all recipes', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([
        {
          id: 'recipe-1',
          name: 'Recipe 1',
          description: 'Description 1',
          ingredients: { tomato: 2 },
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'recipe-2',
          name: 'Recipe 2',
          description: 'Description 2',
          ingredients: { onion: 1 },
          createdAt: new Date('2025-01-02'),
        },
      ]);

      const recipes = await repository.findAll();

      expect(recipes).toHaveLength(2);
      expect(recipes[0].getName()).toBe('Recipe 1');
      expect(recipes[1].getName()).toBe('Recipe 2');
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array if no recipes', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);

      const recipes = await repository.findAll();

      expect(recipes).toHaveLength(0);
    });
  });

  describe('getRandomRecipe', () => {
    it('should get a random recipe', async () => {
      mockPrisma.recipe.count.mockResolvedValue(5);
      mockPrisma.recipe.findMany.mockResolvedValue([
        {
          id: 'recipe-random',
          name: 'Random Recipe',
          description: 'Random description',
          ingredients: { tomato: 3 },
          createdAt: new Date('2025-01-01'),
        },
      ]);

      const recipe = await repository.getRandomRecipe();

      expect(recipe).not.toBeNull();
      expect(recipe.getName()).toBe('Random Recipe');
      expect(mockPrisma.recipe.count).toHaveBeenCalled();
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
        skip: expect.any(Number),
        take: 1,
      });
    });

    it('should throw error if no recipes available', async () => {
      mockPrisma.recipe.count.mockResolvedValue(0);

      await expect(repository.getRandomRecipe()).rejects.toThrow(
        'No recipes available in database'
      );
    });

    it('should throw error if failed to fetch recipe', async () => {
      mockPrisma.recipe.count.mockResolvedValue(5);
      mockPrisma.recipe.findMany.mockResolvedValue([]);

      await expect(repository.getRandomRecipe()).rejects.toThrow(
        'Failed to fetch random recipe'
      );
    });
  });

  describe('delete', () => {
    it('should delete a recipe', async () => {
      const recipeId = new RecipeId('recipe-123');
      mockPrisma.recipe.delete.mockResolvedValue({});

      await repository.delete(recipeId);

      expect(mockPrisma.recipe.delete).toHaveBeenCalledWith({
        where: { id: 'recipe-123' },
      });
    });
  });

  describe('count', () => {
    it('should count all recipes', async () => {
      mockPrisma.recipe.count.mockResolvedValue(10);

      const count = await repository.count();

      expect(count).toBe(10);
      expect(mockPrisma.recipe.count).toHaveBeenCalledWith();
    });
  });
});
