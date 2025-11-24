/**
 * Unit Tests: RequestIngredientsUseCase
 */
import { RequestIngredientsUseCase } from '../../../../src/application/use-cases/RequestIngredientsUseCase';
import { PlateRepository } from '../../../../src/domain/repositories/PlateRepository';
import { WarehouseClient } from '../../../../src/application/ports/out/WarehouseClient';
import { EventPublisher } from '../../../../src/application/ports/out/EventPublisher';
import { Plate } from '../../../../src/domain/entities/Plate';
import { PlateId } from '../../../../src/domain/value-objects/PlateId';
import { RecipeId } from '../../../../src/domain/value-objects/RecipeId';
import { OrderReference } from '../../../../src/domain/value-objects/OrderReference';
import { Ingredients } from '../../../../src/domain/value-objects/Ingredients';

describe('RequestIngredientsUseCase', () => {
  let useCase: RequestIngredientsUseCase;
  let mockPlateRepository: jest.Mocked<PlateRepository>;
  let mockWarehouseClient: jest.Mocked<WarehouseClient>;
  let mockEventPublisher: jest.Mocked<EventPublisher>;

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

    mockWarehouseClient = {
      requestIngredients: jest.fn(),
      initialize: jest.fn(),
      startConsuming: jest.fn(),
      stopConsuming: jest.fn(),
    } as jest.Mocked<WarehouseClient>;

    mockEventPublisher = {
      publish: jest.fn(),
      publishBatch: jest.fn(),
    } as jest.Mocked<EventPublisher>;

    useCase = new RequestIngredientsUseCase(
      mockPlateRepository,
      mockWarehouseClient,
      mockEventPublisher
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should request ingredients for assigned plate', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);
      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });

      // Assign recipe to plate first
      plate.assignRecipe(recipeId, 'Tomato Salad', ingredients);
      plate.clearDomainEvents();

      mockPlateRepository.findById.mockResolvedValue(plate);

      const result = await useCase.execute({ plateId: 'plate-123' });

      expect(result.success).toBe(true);
      expect(result.plateId).toBe('plate-123');
      expect(result.message).toBe('Ingredients request sent to Warehouse');
    });

    it('should save plate after requesting ingredients', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);
      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.clearDomainEvents();

      mockPlateRepository.findById.mockResolvedValue(plate);

      await useCase.execute({ plateId: 'plate-123' });

      expect(mockPlateRepository.save).toHaveBeenCalledWith(plate);
    });

    it('should publish IngredientsRequestedEvent', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);
      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.clearDomainEvents();

      mockPlateRepository.findById.mockResolvedValue(plate);

      await useCase.execute({ plateId: 'plate-123' });

      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });

    it('should send request to warehouse client', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);
      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });

      plate.assignRecipe(recipeId, 'Tomato Salad', ingredients);
      plate.clearDomainEvents();

      mockPlateRepository.findById.mockResolvedValue(plate);

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

    it('should throw error if plate cannot request ingredients', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      // Plate is in PENDING state, cannot request ingredients
      mockPlateRepository.findById.mockResolvedValue(plate);

      await expect(useCase.execute({ plateId: 'plate-123' }))
        .rejects.toThrow('Plate cannot request ingredients in current state');
    });

    it('should handle repository errors', async () => {
      mockPlateRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute({ plateId: 'plate-123' }))
        .rejects.toThrow('Database error');
    });
  });
});
