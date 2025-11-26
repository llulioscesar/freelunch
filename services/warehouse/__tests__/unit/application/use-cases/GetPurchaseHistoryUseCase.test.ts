import { GetPurchaseHistoryUseCase } from '../../../../src/application/use-cases/GetPurchaseHistoryUseCase';
import { PurchaseRepository } from '../../../../src/domain/repositories/PurchaseRepository';
import { Purchase } from '../../../../src/domain/entities/Purchase';
import { PurchaseId } from '../../../../src/domain/value-objects/PurchaseId';
import { IngredientName } from '../../../../src/domain/value-objects/IngredientName';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';

describe('GetPurchaseHistoryUseCase', () => {
  let useCase: GetPurchaseHistoryUseCase;
  let mockPurchaseRepository: jest.Mocked<PurchaseRepository>;

  beforeEach(() => {
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

    useCase = new GetPurchaseHistoryUseCase(mockPurchaseRepository);
  });

  it('should return empty history when no purchases exist', async () => {
    mockPurchaseRepository.findPaginated.mockResolvedValue({ purchases: [], total: 0 });
    mockPurchaseRepository.getStats.mockResolvedValue({ total: 0, successful: 0, failed: 0 });

    const result = await useCase.execute();

    expect(result.purchases).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.successful).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('should use default page and limit', async () => {
    mockPurchaseRepository.findPaginated.mockResolvedValue({ purchases: [], total: 0 });
    mockPurchaseRepository.getStats.mockResolvedValue({ total: 0, successful: 0, failed: 0 });

    await useCase.execute();

    expect(mockPurchaseRepository.findPaginated).toHaveBeenCalledWith(1, 10);
  });

  it('should use custom page and limit when provided', async () => {
    mockPurchaseRepository.findPaginated.mockResolvedValue({ purchases: [], total: 0 });
    mockPurchaseRepository.getStats.mockResolvedValue({ total: 0, successful: 0, failed: 0 });

    await useCase.execute({ page: 2, limit: 50 });

    expect(mockPurchaseRepository.findPaginated).toHaveBeenCalledWith(2, 50);
  });

  it('should return purchase DTOs with correct data', async () => {
    const purchase = new Purchase(
      new PurchaseId('purchase-123'),
      new IngredientName('tomato'),
      new Quantity(5),
      new Quantity(3),
      'completed',
      'plate-456',
      'order-789',
      null,
      new Date('2024-01-01T00:00:00.000Z'),
      new Date('2024-01-01T00:01:00.000Z')
    );

    mockPurchaseRepository.findPaginated.mockResolvedValue({ purchases: [purchase], total: 1 });
    mockPurchaseRepository.getStats.mockResolvedValue({ total: 1, successful: 1, failed: 0 });

    const result = await useCase.execute();

    expect(result.purchases[0]).toMatchObject({
      id: 'purchase-123',
      ingredientName: 'tomato',
      requestedQuantity: 5,
      obtainedQuantity: 3,
      status: 'completed',
      plateId: 'plate-456',
      orderId: 'order-789',
    });
  });

  it('should return stats from repository', async () => {
    const successfulPurchase = new Purchase(
      new PurchaseId('purchase-1'),
      new IngredientName('tomato'),
      new Quantity(5),
      new Quantity(3),
      'completed'
    );

    const failedPurchase = new Purchase(
      new PurchaseId('purchase-2'),
      new IngredientName('cheese'),
      new Quantity(2),
      Quantity.zero(),
      'failed',
      null,
      null,
      'Market unavailable'
    );

    const pendingPurchase = new Purchase(
      new PurchaseId('purchase-3'),
      new IngredientName('lettuce'),
      new Quantity(1)
    );

    mockPurchaseRepository.findPaginated.mockResolvedValue({
      purchases: [successfulPurchase, failedPurchase, pendingPurchase],
      total: 3,
    });
    mockPurchaseRepository.getStats.mockResolvedValue({ total: 3, successful: 1, failed: 1 });

    const result = await useCase.execute();

    expect(result.total).toBe(3);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('should handle purchase with null completedAt', async () => {
    const purchase = new Purchase(
      new PurchaseId('purchase-123'),
      new IngredientName('tomato'),
      new Quantity(5)
    );

    mockPurchaseRepository.findPaginated.mockResolvedValue({ purchases: [purchase], total: 1 });
    mockPurchaseRepository.getStats.mockResolvedValue({ total: 1, successful: 0, failed: 1 });

    const result = await useCase.execute();

    expect(result.purchases[0].completedAt).toBeNull();
  });

  it('should return pagination info', async () => {
    mockPurchaseRepository.findPaginated.mockResolvedValue({ purchases: [], total: 25 });
    mockPurchaseRepository.getStats.mockResolvedValue({ total: 25, successful: 20, failed: 5 });

    const result = await useCase.execute({ page: 2, limit: 10 });

    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });
});
