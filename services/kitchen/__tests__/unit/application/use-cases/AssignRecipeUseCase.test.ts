/**
 * Unit Tests: AssignRecipeUseCase
 */
import { AssignRecipeUseCase } from '../../../../src/application/use-cases/AssignRecipeUseCase';
import { PlateRepository } from '../../../../src/domain/repositories/PlateRepository';
import { RecipeRepository } from '../../../../src/domain/repositories/RecipeRepository';
import { EventPublisher } from '../../../../src/application/ports/out/EventPublisher';
import { WarehouseClient } from '../../../../src/application/ports/out/WarehouseClient';
import { Plate } from '../../../../src/domain/entities/Plate';
import { Recipe } from '../../../../src/domain/entities/Recipe';
import { PlateId } from '../../../../src/domain/value-objects/PlateId';
import { RecipeId } from '../../../../src/domain/value-objects/RecipeId';
import { OrderReference } from '../../../../src/domain/value-objects/OrderReference';
import { Ingredients } from '../../../../src/domain/value-objects/Ingredients';

describe('AssignRecipeUseCase', () => {
  let useCase: AssignRecipeUseCase;
  let mockPlateRepository: jest.Mocked<PlateRepository>;
  let mockRecipeRepository: jest.Mocked<RecipeRepository>;
  let mockEventPublisher: jest.Mocked<EventPublisher>;
  let mockWarehouseClient: jest.Mocked<WarehouseClient>;

  beforeEach(() => {
    mockPlateRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrderItemId: jest.fn(),
      findByOrderId: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
      findInProgress: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<PlateRepository>;

    mockRecipeRepository = {
      save: jest.fn(),
      getRandomRecipe: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<RecipeRepository>;

    mockEventPublisher = {
      publish: jest.fn(),
      publishBatch: jest.fn(),
    } as jest.Mocked<EventPublisher>;

    mockWarehouseClient = {
      requestIngredients: jest.fn(),
      initialize: jest.fn(),
      startConsuming: jest.fn(),
      stopConsuming: jest.fn(),
    } as jest.Mocked<WarehouseClient>;

    useCase = new AssignRecipeUseCase(
      mockPlateRepository,
      mockRecipeRepository,
      mockEventPublisher,
      mockWarehouseClient
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should assign recipe to plate', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });
      const recipe = new Recipe(recipeId, 'Tomato Salad', ingredients);

      mockPlateRepository.findById.mockResolvedValue(plate);
      mockRecipeRepository.getRandomRecipe.mockResolvedValue(recipe);

      const result = await useCase.execute({ plateId: 'plate-123' });

      expect(result.success).toBe(true);
      expect(result.plateId).toBe('plate-123');
      expect(result.recipeId).toBe('recipe-abc');
      expect(result.recipeName).toBe('Tomato Salad');
    });

    it('should save plate after assigning recipe', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      mockPlateRepository.findById.mockResolvedValue(plate);
      mockRecipeRepository.getRandomRecipe.mockResolvedValue(recipe);

      await useCase.execute({ plateId: 'plate-123' });

      expect(mockPlateRepository.save).toHaveBeenCalledTimes(2); // Once for assign, once for request ingredients
    });

    it('should publish PlateAssignedEvent', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      mockPlateRepository.findById.mockResolvedValue(plate);
      mockRecipeRepository.getRandomRecipe.mockResolvedValue(recipe);

      await useCase.execute({ plateId: 'plate-123' });

      expect(mockEventPublisher.publish).toHaveBeenCalled();
      const firstCall = mockEventPublisher.publish.mock.calls[0][0];
      expect(firstCall.eventName).toBe('kitchen.plate.assigned');
    });

    it('should request ingredients from warehouse', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });
      const recipe = new Recipe(recipeId, 'Tomato Salad', ingredients);

      mockPlateRepository.findById.mockResolvedValue(plate);
      mockRecipeRepository.getRandomRecipe.mockResolvedValue(recipe);

      await useCase.execute({ plateId: 'plate-123' });

      expect(mockWarehouseClient.requestIngredients).toHaveBeenCalledWith(
        expect.objectContaining({
          plateId: 'plate-123',
          orderItemId: 'item-789',
          recipeId: 'recipe-abc',
          recipeName: 'Tomato Salad',
          ingredients: { tomato: 2, onion: 1 },
        })
      );
    });

    it('should throw error if plate not found', async () => {
      mockPlateRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({ plateId: 'invalid-plate' }))
        .rejects.toThrow('Plate not found: invalid-plate');
    });

    it('should throw error if no recipes available', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      mockPlateRepository.findById.mockResolvedValue(plate);
      mockRecipeRepository.getRandomRecipe.mockRejectedValue(new Error('No recipes available'));

      await expect(useCase.execute({ plateId: 'plate-123' }))
        .rejects.toThrow('No recipes available');
    });

    it('should handle repository errors', async () => {
      mockPlateRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute({ plateId: 'plate-123' }))
        .rejects.toThrow('Database error');
    });

    it('should return ingredients in response', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 3, cheese: 2 });
      const recipe = new Recipe(recipeId, 'Recipe', ingredients);

      mockPlateRepository.findById.mockResolvedValue(plate);
      mockRecipeRepository.getRandomRecipe.mockResolvedValue(recipe);

      const result = await useCase.execute({ plateId: 'plate-123' });

      expect(result.ingredients).toEqual({ tomato: 3, cheese: 2 });
    });
  });
});
