import { PrismaInventoryRepository } from '../../../../../src/infrastructure/adapters/persistence/PrismaInventoryRepository';
import { PrismaClientSingleton } from '../../../../../src/infrastructure/adapters/persistence/PrismaClient';
import { InventoryItem } from '../../../../../src/domain/entities/InventoryItem';
import { InventoryItemId } from '../../../../../src/domain/value-objects/InventoryItemId';
import { IngredientName } from '../../../../../src/domain/value-objects/IngredientName';
import { Quantity } from '../../../../../src/domain/value-objects/Quantity';

// Mock Prisma
jest.mock('../../../../../src/infrastructure/adapters/persistence/PrismaClient', () => ({
  PrismaClientSingleton: {
    getInstance: jest.fn(),
  },
}));

describe('PrismaInventoryRepository', () => {
  let repository: PrismaInventoryRepository;
  let mockPrisma: {
    inventoryItem: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      inventoryItem: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    (PrismaClientSingleton.getInstance as jest.Mock).mockReturnValue(mockPrisma);
    repository = new PrismaInventoryRepository();
  });

  const mockRecord = {
    id: 'item-123',
    ingredientName: 'tomato',
    quantity: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('findById', () => {
    it('should return inventory item when found', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockRecord);

      const result = await repository.findById(new InventoryItemId('item-123'));

      expect(result).toBeInstanceOf(InventoryItem);
      expect(result?.getId().getValue()).toBe('item-123');
      expect(result?.getIngredientName().getValue()).toBe('tomato');
    });

    it('should return null when not found', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);

      const result = await repository.findById(new InventoryItemId('non-existent'));

      expect(result).toBeNull();
    });
  });

  describe('findByIngredientName', () => {
    it('should return inventory item when found', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockRecord);

      const result = await repository.findByIngredientName(
        new IngredientName('tomato')
      );

      expect(result).toBeInstanceOf(InventoryItem);
      expect(result?.getIngredientName().getValue()).toBe('tomato');
    });

    it('should return null when not found', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);

      const result = await repository.findByIngredientName(
        new IngredientName('cheese')
      );

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all inventory items', async () => {
      const records = [
        mockRecord,
        { ...mockRecord, id: 'item-456', ingredientName: 'cheese' },
      ];
      mockPrisma.inventoryItem.findMany.mockResolvedValue(records);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(InventoryItem);
    });

    it('should return empty array when no items', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should upsert inventory item', async () => {
      mockPrisma.inventoryItem.upsert.mockResolvedValue(mockRecord);

      const item = new InventoryItem(
        new InventoryItemId('item-123'),
        new IngredientName('tomato'),
        new Quantity(5)
      );

      await repository.save(item);

      expect(mockPrisma.inventoryItem.upsert).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        create: expect.objectContaining({
          id: 'item-123',
          ingredientName: 'tomato',
          quantity: 5,
        }),
        update: expect.objectContaining({
          ingredientName: 'tomato',
          quantity: 5,
        }),
      });
    });
  });

  describe('initializeDefaultStock', () => {
    it('should create items for non-existing ingredients', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);
      mockPrisma.inventoryItem.create.mockResolvedValue(mockRecord);

      await repository.initializeDefaultStock();

      const allIngredients = IngredientName.getAllValidIngredients();
      expect(mockPrisma.inventoryItem.findUnique).toHaveBeenCalledTimes(
        allIngredients.length
      );
      expect(mockPrisma.inventoryItem.create).toHaveBeenCalledTimes(
        allIngredients.length
      );
    });

    it('should not create items that already exist', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockRecord);

      await repository.initializeDefaultStock();

      expect(mockPrisma.inventoryItem.create).not.toHaveBeenCalled();
    });
  });

  describe('findByIngredientNames', () => {
    it('should return items matching ingredient names', async () => {
      const records = [
        mockRecord,
        { ...mockRecord, id: 'item-456', ingredientName: 'cheese' },
      ];
      mockPrisma.inventoryItem.findMany.mockResolvedValue(records);

      const result = await repository.findByIngredientNames([
        new IngredientName('tomato'),
        new IngredientName('cheese'),
      ]);

      expect(result).toHaveLength(2);
      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: {
          ingredientName: { in: ['tomato', 'cheese'] },
        },
      });
    });
  });

  describe('checkAvailability', () => {
    it('should return available true when all ingredients have enough stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue({ quantity: 10 });

      const requirements = new Map<string, number>();
      requirements.set('tomato', 5);
      requirements.set('cheese', 3);

      const result = await repository.checkAvailability(requirements);

      expect(result.available).toBe(true);
      expect(result.missing.size).toBe(0);
    });

    it('should return missing quantities when insufficient stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockImplementation(async ({ where }) => {
        if (where.ingredientName === 'tomato') return { quantity: 2 };
        if (where.ingredientName === 'cheese') return { quantity: 0 };
        return null;
      });

      const requirements = new Map<string, number>();
      requirements.set('tomato', 5);
      requirements.set('cheese', 3);

      const result = await repository.checkAvailability(requirements);

      expect(result.available).toBe(false);
      expect(result.missing.get('tomato')).toBe(3);
      expect(result.missing.get('cheese')).toBe(3);
    });

    it('should handle non-existing items as zero quantity', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);

      const requirements = new Map<string, number>();
      requirements.set('tomato', 5);

      const result = await repository.checkAvailability(requirements);

      expect(result.available).toBe(false);
      expect(result.missing.get('tomato')).toBe(5);
    });
  });
});
