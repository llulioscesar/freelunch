// Mock the Prisma client modules before importing the repository
jest.mock('../../../../../src/generated/prisma/client/index.js', () => ({
  PrismaClient: jest.fn(),
}));

jest.mock('../../../../../src/infrastructure/adapters/persistence/PrismaClient.js', () => ({
  prismaClient: {},
}));

import { PrismaStatusHistoryRepository } from '../../../../../src/infrastructure/adapters/persistence/PrismaStatusHistoryRepository';

describe('PrismaStatusHistoryRepository', () => {
  let repository: PrismaStatusHistoryRepository;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = {
      plateStatusHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    repository = new PrismaStatusHistoryRepository(mockPrisma);
  });

  describe('record', () => {
    it('should create a status history entry', async () => {
      const entry = {
        plateId: 'plate-123',
        fromStatus: 'PENDING',
        toStatus: 'ASSIGNED',
        recipeId: 'recipe-456',
        recipeName: 'Test Recipe',
      };

      const createdEntry = {
        id: 'history-1',
        ...entry,
        changedAt: new Date(),
        reason: null,
        metadata: null,
      };

      mockPrisma.plateStatusHistory.create.mockResolvedValue(createdEntry);

      const result = await repository.record(entry);

      expect(mockPrisma.plateStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          plateId: 'plate-123',
          fromStatus: 'PENDING',
          toStatus: 'ASSIGNED',
        }),
      });
      expect(result.id).toBe('history-1');
      expect(result.toStatus).toBe('ASSIGNED');
    });

    it('should handle null fromStatus for initial state', async () => {
      const entry = {
        plateId: 'plate-123',
        fromStatus: null,
        toStatus: 'PENDING',
      };

      mockPrisma.plateStatusHistory.create.mockResolvedValue({
        id: 'history-1',
        ...entry,
        changedAt: new Date(),
        recipeId: null,
        recipeName: null,
        reason: null,
        metadata: null,
      });

      const result = await repository.record(entry);

      expect(result.fromStatus).toBeNull();
      expect(result.toStatus).toBe('PENDING');
    });
  });

  describe('findByPlateId', () => {
    it('should return history entries for a plate', async () => {
      const entries = [
        {
          id: 'h1',
          plateId: 'plate-123',
          fromStatus: null,
          toStatus: 'PENDING',
          changedAt: new Date('2025-01-01T10:00:00Z'),
          recipeId: null,
          recipeName: null,
          reason: null,
          metadata: null,
        },
        {
          id: 'h2',
          plateId: 'plate-123',
          fromStatus: 'PENDING',
          toStatus: 'ASSIGNED',
          changedAt: new Date('2025-01-01T10:01:00Z'),
          recipeId: 'recipe-1',
          recipeName: 'Pizza',
          reason: null,
          metadata: null,
        },
      ];

      mockPrisma.plateStatusHistory.findMany.mockResolvedValue(entries);

      const result = await repository.findByPlateId('plate-123');

      expect(mockPrisma.plateStatusHistory.findMany).toHaveBeenCalledWith({
        where: { plateId: 'plate-123' },
        orderBy: { changedAt: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].toStatus).toBe('PENDING');
      expect(result[1].toStatus).toBe('ASSIGNED');
    });

    it('should return empty array if no history', async () => {
      mockPrisma.plateStatusHistory.findMany.mockResolvedValue([]);

      const result = await repository.findByPlateId('non-existent');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByOrderId', () => {
    it('should return history for all plates in an order', async () => {
      const entries = [
        {
          id: 'h1',
          plateId: 'plate-1',
          fromStatus: null,
          toStatus: 'PENDING',
          changedAt: new Date(),
          recipeId: null,
          recipeName: null,
          reason: null,
          metadata: null,
        },
      ];

      mockPrisma.plateStatusHistory.findMany.mockResolvedValue(entries);

      const result = await repository.findByOrderId('order-123');

      expect(mockPrisma.plateStatusHistory.findMany).toHaveBeenCalledWith({
        where: { plate: { orderId: 'order-123' } },
        orderBy: { changedAt: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findRecent', () => {
    it('should return recent history entries', async () => {
      const entries = [
        {
          id: 'h1',
          plateId: 'plate-1',
          fromStatus: 'COOKING',
          toStatus: 'READY',
          changedAt: new Date(),
          recipeId: 'r1',
          recipeName: 'Salad',
          reason: null,
          metadata: null,
        },
      ];

      mockPrisma.plateStatusHistory.findMany.mockResolvedValue(entries);

      const result = await repository.findRecent(10);

      expect(mockPrisma.plateStatusHistory.findMany).toHaveBeenCalledWith({
        orderBy: { changedAt: 'desc' },
        take: 10,
      });
      expect(result).toHaveLength(1);
    });

    it('should use default limit of 50', async () => {
      mockPrisma.plateStatusHistory.findMany.mockResolvedValue([]);

      await repository.findRecent();

      expect(mockPrisma.plateStatusHistory.findMany).toHaveBeenCalledWith({
        orderBy: { changedAt: 'desc' },
        take: 50,
      });
    });
  });
});
