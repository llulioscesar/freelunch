import { GetInventoryUseCase } from '../../../../src/application/use-cases/GetInventoryUseCase';
import { InventoryRepository } from '../../../../src/domain/repositories/InventoryRepository';
import { InventoryItem } from '../../../../src/domain/entities/InventoryItem';
import { InventoryItemId } from '../../../../src/domain/value-objects/InventoryItemId';
import { IngredientName } from '../../../../src/domain/value-objects/IngredientName';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';

describe('GetInventoryUseCase', () => {
  let useCase: GetInventoryUseCase;
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

    useCase = new GetInventoryUseCase(mockInventoryRepository);
  });

  it('should return empty inventory when no items exist', async () => {
    mockInventoryRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.lastUpdated).toBeDefined();
  });

  it('should return inventory items sorted by ingredient name', async () => {
    const items = [
      new InventoryItem(
        new InventoryItemId('item-1'),
        new IngredientName('tomato'),
        new Quantity(5)
      ),
      new InventoryItem(
        new InventoryItemId('item-2'),
        new IngredientName('cheese'),
        new Quantity(3)
      ),
      new InventoryItem(
        new InventoryItemId('item-3'),
        new IngredientName('lettuce'),
        new Quantity(8)
      ),
    ];

    mockInventoryRepository.findAll.mockResolvedValue(items);

    const result = await useCase.execute();

    expect(result.items).toHaveLength(3);
    expect(result.items[0].ingredientName).toBe('cheese');
    expect(result.items[1].ingredientName).toBe('lettuce');
    expect(result.items[2].ingredientName).toBe('tomato');
    expect(result.totalItems).toBe(3);
  });

  it('should return correct item DTOs', async () => {
    const item = new InventoryItem(
      new InventoryItemId('item-123'),
      new IngredientName('tomato'),
      new Quantity(5)
    );

    mockInventoryRepository.findAll.mockResolvedValue([item]);

    const result = await useCase.execute();

    expect(result.items[0]).toMatchObject({
      id: 'item-123',
      ingredientName: 'tomato',
      quantity: 5,
    });
    expect(result.items[0].createdAt).toBeDefined();
    expect(result.items[0].updatedAt).toBeDefined();
  });

  it('should set lastUpdated to most recent update time', async () => {
    const olderDate = new Date('2024-01-01T00:00:00.000Z');
    const newerDate = new Date('2024-01-02T00:00:00.000Z');

    const items = [
      new InventoryItem(
        new InventoryItemId('item-1'),
        new IngredientName('tomato'),
        new Quantity(5),
        olderDate,
        olderDate
      ),
      new InventoryItem(
        new InventoryItemId('item-2'),
        new IngredientName('cheese'),
        new Quantity(3),
        olderDate,
        newerDate
      ),
    ];

    mockInventoryRepository.findAll.mockResolvedValue(items);

    const result = await useCase.execute();

    expect(result.lastUpdated).toBe(newerDate.toISOString());
  });
});
