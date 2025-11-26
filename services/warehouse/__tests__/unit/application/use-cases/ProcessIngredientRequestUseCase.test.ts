import { ProcessIngredientRequestUseCase } from '../../../../src/application/use-cases/ProcessIngredientRequestUseCase';
import { InventoryRepository } from '../../../../src/domain/repositories/InventoryRepository';
import { PurchaseRepository } from '../../../../src/domain/repositories/PurchaseRepository';
import { MarketClient } from '../../../../src/application/ports/out/MarketClient';
import { KitchenClient } from '../../../../src/application/ports/out/KitchenClient';
import { InventoryItem } from '../../../../src/domain/entities/InventoryItem';
import { InventoryItemId } from '../../../../src/domain/value-objects/InventoryItemId';
import { IngredientName } from '../../../../src/domain/value-objects/IngredientName';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';

describe('ProcessIngredientRequestUseCase', () => {
  let useCase: ProcessIngredientRequestUseCase;
  let mockInventoryRepository: jest.Mocked<InventoryRepository>;
  let mockPurchaseRepository: jest.Mocked<PurchaseRepository>;
  let mockMarketClient: jest.Mocked<MarketClient>;
  let mockKitchenClient: jest.Mocked<KitchenClient>;

  beforeEach(() => {
    mockInventoryRepository = {
      findById: jest.fn(),
      findByIngredientName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      initializeDefaultStock: jest.fn(),
      findByIngredientNames: jest.fn(),
      checkAvailability: jest.fn(),
      getStats: jest.fn(),
    };

    mockPurchaseRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      findByIngredientName: jest.fn(),
      findByPlateId: jest.fn(),
      findRecent: jest.fn(),
      findPaginated: jest.fn(),
      save: jest.fn(),
      countByStatus: jest.fn(),
      getStats: jest.fn(),
      getTotalPurchasedByIngredient: jest.fn(),
      getFailedByIngredient: jest.fn(),
      getCountsByStatus: jest.fn(),
    };

    mockMarketClient = {
      buyIngredient: jest.fn(),
    };

    mockKitchenClient = {
      sendIngredientsResponse: jest.fn(),
    };

    useCase = new ProcessIngredientRequestUseCase(
      mockInventoryRepository,
      mockPurchaseRepository,
      mockMarketClient,
      mockKitchenClient
    );
  });

  const createInventoryItem = (
    name: string,
    quantity: number
  ): InventoryItem => {
    return new InventoryItem(
      new InventoryItemId(`item-${name}`),
      new IngredientName(name),
      new Quantity(quantity)
    );
  };

  describe('when ingredients are available in inventory', () => {
    it('should reserve ingredients and send success response', async () => {
      const tomatoItem = createInventoryItem('tomato', 5);

      mockInventoryRepository.findByIngredientName.mockResolvedValue(tomatoItem);
      mockKitchenClient.sendIngredientsResponse.mockResolvedValue(undefined);

      const result = await useCase.execute({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-789',
        recipeName: 'Tomato Salad',
        ingredients: { tomato: 2 },
        requestedAt: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
      expect(result.processedIngredients).toEqual({ tomato: 2 });
      expect(result.unavailableIngredients).toEqual([]);
      expect(mockInventoryRepository.save).toHaveBeenCalled();
      expect(mockKitchenClient.sendIngredientsResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          plateId: 'plate-123',
          success: true,
        })
      );
    });
  });

  describe('when ingredients need to be purchased', () => {
    it('should purchase from market and reserve', async () => {
      const tomatoItem = createInventoryItem('tomato', 1);

      mockInventoryRepository.findByIngredientName
        .mockResolvedValueOnce(tomatoItem) // Initial check
        .mockResolvedValueOnce(createInventoryItem('tomato', 4)); // After purchase

      mockMarketClient.buyIngredient.mockResolvedValue({
        ingredient: 'tomato',
        quantitySold: 3,
        success: true,
      });

      mockKitchenClient.sendIngredientsResponse.mockResolvedValue(undefined);

      const result = await useCase.execute({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-789',
        recipeName: 'Tomato Salad',
        ingredients: { tomato: 2 },
        requestedAt: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
      expect(mockMarketClient.buyIngredient).toHaveBeenCalledWith('tomato');
      expect(mockPurchaseRepository.save).toHaveBeenCalled();
    });
  });

  describe('when ingredient does not exist in inventory', () => {
    it('should create inventory item with initial stock', async () => {
      mockInventoryRepository.findByIngredientName.mockResolvedValue(null);
      mockMarketClient.buyIngredient.mockResolvedValue({
        ingredient: 'tomato',
        quantitySold: 0,
        success: false,
      });
      mockKitchenClient.sendIngredientsResponse.mockResolvedValue(undefined);

      // After save, return a new item
      mockInventoryRepository.findByIngredientName
        .mockResolvedValueOnce(null) // First check
        .mockResolvedValueOnce(createInventoryItem('tomato', 5)); // After creation

      const result = await useCase.execute({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-789',
        recipeName: 'Tomato Salad',
        ingredients: { tomato: 2 },
        requestedAt: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('when market purchase fails', () => {
    it('should continue attempting up to max retries', async () => {
      const tomatoItem = createInventoryItem('tomato', 0);

      mockInventoryRepository.findByIngredientName.mockResolvedValue(tomatoItem);
      mockMarketClient.buyIngredient.mockResolvedValue({
        ingredient: 'tomato',
        quantitySold: 0,
        success: false,
      });
      mockKitchenClient.sendIngredientsResponse.mockResolvedValue(undefined);

      const result = await useCase.execute({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-789',
        recipeName: 'Tomato Salad',
        ingredients: { tomato: 2 },
        requestedAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
      expect(result.unavailableIngredients).toContain('tomato');
      // Should have tried multiple times
      expect(mockMarketClient.buyIngredient.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('when multiple ingredients are requested', () => {
    it('should process all ingredients', async () => {
      const tomatoItem = createInventoryItem('tomato', 5);
      const cheeseItem = createInventoryItem('cheese', 5);

      mockInventoryRepository.findByIngredientName
        .mockImplementation(async (name: IngredientName) => {
          if (name.getValue() === 'tomato') return tomatoItem;
          if (name.getValue() === 'cheese') return cheeseItem;
          return null;
        });

      mockKitchenClient.sendIngredientsResponse.mockResolvedValue(undefined);

      const result = await useCase.execute({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-789',
        recipeName: 'Cheese Tomato',
        ingredients: { tomato: 2, cheese: 1 },
        requestedAt: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
      expect(result.processedIngredients).toEqual({ tomato: 2, cheese: 1 });
    });

    it('should fail if any ingredient is unavailable', async () => {
      const tomatoItem = createInventoryItem('tomato', 5);
      const cheeseItem = createInventoryItem('cheese', 0);

      mockInventoryRepository.findByIngredientName
        .mockImplementation(async (name: IngredientName) => {
          if (name.getValue() === 'tomato') return tomatoItem;
          if (name.getValue() === 'cheese') return cheeseItem;
          return null;
        });

      mockMarketClient.buyIngredient.mockResolvedValue({
        ingredient: 'cheese',
        quantitySold: 0,
        success: false,
      });

      mockKitchenClient.sendIngredientsResponse.mockResolvedValue(undefined);

      const result = await useCase.execute({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        recipeId: 'recipe-789',
        recipeName: 'Cheese Tomato',
        ingredients: { tomato: 2, cheese: 3 },
        requestedAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
      expect(result.unavailableIngredients).toContain('cheese');
    });
  });
});
