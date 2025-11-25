import { PrismaPurchaseRepository } from '../../../../../src/infrastructure/adapters/persistence/PrismaPurchaseRepository';
import { PrismaClientSingleton } from '../../../../../src/infrastructure/adapters/persistence/PrismaClient';
import { Purchase } from '../../../../../src/domain/entities/Purchase';
import { PurchaseId } from '../../../../../src/domain/value-objects/PurchaseId';
import { IngredientName } from '../../../../../src/domain/value-objects/IngredientName';
import { Quantity } from '../../../../../src/domain/value-objects/Quantity';

// Mock Prisma
jest.mock('../../../../../src/infrastructure/adapters/persistence/PrismaClient', () => ({
  PrismaClientSingleton: {
    getInstance: jest.fn(),
  },
}));

describe('PrismaPurchaseRepository', () => {
  let repository: PrismaPurchaseRepository;
  let mockPrisma: {
    purchase: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      purchase: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    (PrismaClientSingleton.getInstance as jest.Mock).mockReturnValue(mockPrisma);
    repository = new PrismaPurchaseRepository();
  });

  const mockRecord = {
    id: 'purchase-123',
    ingredientName: 'tomato',
    requestedQuantity: 5,
    obtainedQuantity: 3,
    status: 'completed',
    plateId: 'plate-456',
    orderId: 'order-789',
    errorMessage: null,
    createdAt: new Date('2024-01-01'),
    completedAt: new Date('2024-01-01'),
  };

  describe('findById', () => {
    it('should return purchase when found', async () => {
      mockPrisma.purchase.findUnique.mockResolvedValue(mockRecord);

      const result = await repository.findById(new PurchaseId('purchase-123'));

      expect(result).toBeInstanceOf(Purchase);
      expect(result?.getId().getValue()).toBe('purchase-123');
    });

    it('should return null when not found', async () => {
      mockPrisma.purchase.findUnique.mockResolvedValue(null);

      const result = await repository.findById(new PurchaseId('non-existent'));

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all purchases', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([mockRecord]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Purchase);
    });
  });

  describe('findByStatus', () => {
    it('should return purchases by status', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([mockRecord]);

      const result = await repository.findByStatus('completed');

      expect(result).toHaveLength(1);
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith({
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByIngredientName', () => {
    it('should return purchases by ingredient name', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([mockRecord]);

      const result = await repository.findByIngredientName(
        new IngredientName('tomato')
      );

      expect(result).toHaveLength(1);
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith({
        where: { ingredientName: 'tomato' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByPlateId', () => {
    it('should return purchases by plate id', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([mockRecord]);

      const result = await repository.findByPlateId('plate-456');

      expect(result).toHaveLength(1);
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith({
        where: { plateId: 'plate-456' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findRecent', () => {
    it('should return recent purchases with limit', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([mockRecord]);

      const result = await repository.findRecent(10);

      expect(result).toHaveLength(1);
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('save', () => {
    it('should upsert purchase', async () => {
      mockPrisma.purchase.upsert.mockResolvedValue(mockRecord);

      const purchase = new Purchase(
        new PurchaseId('purchase-123'),
        new IngredientName('tomato'),
        new Quantity(5),
        new Quantity(3),
        'completed',
        'plate-456',
        'order-789'
      );

      await repository.save(purchase);

      expect(mockPrisma.purchase.upsert).toHaveBeenCalledWith({
        where: { id: 'purchase-123' },
        create: expect.objectContaining({
          id: 'purchase-123',
          ingredientName: 'tomato',
          requestedQuantity: 5,
          obtainedQuantity: 3,
        }),
        update: expect.objectContaining({
          ingredientName: 'tomato',
          requestedQuantity: 5,
          obtainedQuantity: 3,
        }),
      });
    });
  });

  describe('countByStatus', () => {
    it('should count purchases by status', async () => {
      mockPrisma.purchase.count.mockResolvedValue(5);

      const result = await repository.countByStatus('completed');

      expect(result).toBe(5);
      expect(mockPrisma.purchase.count).toHaveBeenCalledWith({
        where: { status: 'completed' },
      });
    });
  });

  describe('getTotalPurchasedByIngredient', () => {
    it('should return total purchased quantity', async () => {
      mockPrisma.purchase.aggregate.mockResolvedValue({
        _sum: { obtainedQuantity: 15 },
      });

      const result = await repository.getTotalPurchasedByIngredient(
        new IngredientName('tomato')
      );

      expect(result).toBe(15);
    });

    it('should return 0 when no purchases', async () => {
      mockPrisma.purchase.aggregate.mockResolvedValue({
        _sum: { obtainedQuantity: null },
      });

      const result = await repository.getTotalPurchasedByIngredient(
        new IngredientName('tomato')
      );

      expect(result).toBe(0);
    });
  });
});
