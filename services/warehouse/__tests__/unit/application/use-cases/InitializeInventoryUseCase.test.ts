import { InitializeInventoryUseCase } from '../../../../src/application/use-cases/InitializeInventoryUseCase';
import { InventoryRepository } from '../../../../src/domain/repositories/InventoryRepository';
import { InventoryItem } from '../../../../src/domain/entities/InventoryItem';
import { IngredientName } from '../../../../src/domain/value-objects/IngredientName';

describe('InitializeInventoryUseCase', () => {
  let useCase: InitializeInventoryUseCase;
  let mockInventoryRepository: jest.Mocked<InventoryRepository>;

  beforeEach(() => {
    mockInventoryRepository = {
      findById: jest.fn(),
      findByIngredientName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      initializeDefaultStock: jest.fn(),
      findByIngredientNames: jest.fn(),
      checkAvailability: jest.fn(),
    };

    useCase = new InitializeInventoryUseCase(mockInventoryRepository);
  });

  it('should create inventory items for all valid ingredients', async () => {
    mockInventoryRepository.findByIngredientName.mockResolvedValue(null);
    mockInventoryRepository.save.mockResolvedValue(undefined);

    await useCase.execute();

    const allIngredients = IngredientName.getAllValidIngredients();
    expect(mockInventoryRepository.findByIngredientName).toHaveBeenCalledTimes(
      allIngredients.length
    );
    expect(mockInventoryRepository.save).toHaveBeenCalledTimes(
      allIngredients.length
    );
  });

  it('should not create items that already exist', async () => {
    const existingItem = InventoryItem.createWithInitialStock('tomato', 5);

    mockInventoryRepository.findByIngredientName.mockImplementation(
      async (name: IngredientName) => {
        if (name.getValue() === 'tomato') {
          return existingItem;
        }
        return null;
      }
    );
    mockInventoryRepository.save.mockResolvedValue(undefined);

    await useCase.execute();

    // Should create all except tomato (which exists)
    const allIngredients = IngredientName.getAllValidIngredients();
    expect(mockInventoryRepository.save).toHaveBeenCalledTimes(
      allIngredients.length - 1
    );
  });

  it('should create items with initial stock of 5', async () => {
    mockInventoryRepository.findByIngredientName.mockResolvedValue(null);
    mockInventoryRepository.save.mockResolvedValue(undefined);

    await useCase.execute();

    const savedItems = mockInventoryRepository.save.mock.calls.map(
      (call) => call[0]
    );

    savedItems.forEach((item) => {
      expect(item.getQuantity().getValue()).toBe(5);
    });
  });
});
