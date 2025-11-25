import { PrismaStatusHistoryRepository } from '../../../../../src/infrastructure/adapters/persistence/PrismaStatusHistoryRepository';

// Mock Prisma Client
const mockPrisma = {
  orderItemStatusHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('PrismaStatusHistoryRepository', () => {
  let repository: PrismaStatusHistoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaStatusHistoryRepository(mockPrisma as any);
  });

  describe('record', () => {
    it('should create a status history entry', async () => {
      const entry = {
        orderItemId: 'item-123',
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

      mockPrisma.orderItemStatusHistory.create.mockResolvedValue(createdEntry);

      const result = await repository.record(entry);

      expect(mockPrisma.orderItemStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderItemId: 'item-123',
          fromStatus: 'PENDING',
          toStatus: 'ASSIGNED',
        }),
      });
      expect(result.id).toBe('history-1');
      expect(result.toStatus).toBe('ASSIGNED');
    });

    it('should handle null fromStatus for initial state', async () => {
      const entry = {
        orderItemId: 'item-123',
        fromStatus: null,
        toStatus: 'PENDING',
      };

      mockPrisma.orderItemStatusHistory.create.mockResolvedValue({
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

    it('should include reason for failed status', async () => {
      const entry = {
        orderItemId: 'item-123',
        fromStatus: 'COOKING',
        toStatus: 'FAILED',
        reason: 'Ingredients unavailable',
      };

      mockPrisma.orderItemStatusHistory.create.mockResolvedValue({
        id: 'history-1',
        ...entry,
        changedAt: new Date(),
        recipeId: null,
        recipeName: null,
        metadata: null,
      });

      const result = await repository.record(entry);

      expect(result.reason).toBe('Ingredients unavailable');
    });
  });

  describe('findByOrderItemId', () => {
    it('should return history entries for an order item', async () => {
      const entries = [
        {
          id: 'h1',
          orderItemId: 'item-123',
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
          orderItemId: 'item-123',
          fromStatus: 'PENDING',
          toStatus: 'ASSIGNED',
          changedAt: new Date('2025-01-01T10:01:00Z'),
          recipeId: 'recipe-1',
          recipeName: 'Pizza',
          reason: null,
          metadata: null,
        },
      ];

      mockPrisma.orderItemStatusHistory.findMany.mockResolvedValue(entries);

      const result = await repository.findByOrderItemId('item-123');

      expect(mockPrisma.orderItemStatusHistory.findMany).toHaveBeenCalledWith({
        where: { orderItemId: 'item-123' },
        orderBy: { changedAt: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].toStatus).toBe('PENDING');
      expect(result[1].toStatus).toBe('ASSIGNED');
    });

    it('should return empty array if no history', async () => {
      mockPrisma.orderItemStatusHistory.findMany.mockResolvedValue([]);

      const result = await repository.findByOrderItemId('non-existent');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByOrderId', () => {
    it('should return history for all items in an order', async () => {
      const entries = [
        {
          id: 'h1',
          orderItemId: 'item-1',
          fromStatus: null,
          toStatus: 'PENDING',
          changedAt: new Date(),
          recipeId: null,
          recipeName: null,
          reason: null,
          metadata: null,
        },
        {
          id: 'h2',
          orderItemId: 'item-2',
          fromStatus: null,
          toStatus: 'PENDING',
          changedAt: new Date(),
          recipeId: null,
          recipeName: null,
          reason: null,
          metadata: null,
        },
      ];

      mockPrisma.orderItemStatusHistory.findMany.mockResolvedValue(entries);

      const result = await repository.findByOrderId('order-123');

      expect(mockPrisma.orderItemStatusHistory.findMany).toHaveBeenCalledWith({
        where: { orderItem: { orderId: 'order-123' } },
        orderBy: { changedAt: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findRecent', () => {
    it('should return recent history entries', async () => {
      const entries = [
        {
          id: 'h1',
          orderItemId: 'item-1',
          fromStatus: 'COOKING',
          toStatus: 'READY',
          changedAt: new Date(),
          recipeId: 'r1',
          recipeName: 'Salad',
          reason: null,
          metadata: null,
        },
      ];

      mockPrisma.orderItemStatusHistory.findMany.mockResolvedValue(entries);

      const result = await repository.findRecent(10);

      expect(mockPrisma.orderItemStatusHistory.findMany).toHaveBeenCalledWith({
        orderBy: { changedAt: 'desc' },
        take: 10,
      });
      expect(result).toHaveLength(1);
    });

    it('should use default limit of 50', async () => {
      mockPrisma.orderItemStatusHistory.findMany.mockResolvedValue([]);

      await repository.findRecent();

      expect(mockPrisma.orderItemStatusHistory.findMany).toHaveBeenCalledWith({
        orderBy: { changedAt: 'desc' },
        take: 50,
      });
    });
  });
});
