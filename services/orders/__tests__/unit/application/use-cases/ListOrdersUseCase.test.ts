/**
 * Unit Tests: ListOrdersUseCase
 */
import { ListOrdersUseCase } from '../../../../src/application/use-cases/ListOrdersUseCase';
import { OrderRepository } from '../../../../src/domain/repositories/OrderRepository';
import { Order } from '../../../../src/domain/entities/Order';
import { OrderId } from '../../../../src/domain/value-objects/OrderId';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';
import { CustomerInfo } from '../../../../src/domain/value-objects/CustomerInfo';
import { OrderStatusEnum } from '../../../../src/domain/value-objects/OrderStatus';

// Mock dependencies
const mockOrderRepository: jest.Mocked<OrderRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
};

// Mock logger
jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    logUseCaseStart: jest.fn(),
    logUseCaseEnd: jest.fn(),
    logUseCaseError: jest.fn(),
    logRepositoryOperation: jest.fn(),
    logDomainEvent: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: {
    recordUseCaseExecution: jest.fn(),
  },
}));

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepository.findAll.mockResolvedValue([]);
    mockOrderRepository.count.mockResolvedValue(0);
    useCase = new ListOrdersUseCase(mockOrderRepository);
  });

  describe('execute', () => {
    it('should list all orders', async () => {
      const orders = [
        new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1')),
        new Order(new OrderId(), new Quantity(2), new CustomerInfo('Customer 2')),
      ];

      mockOrderRepository.findAll.mockResolvedValue(orders);
      mockOrderRepository.count.mockResolvedValue(2);

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should support pagination', async () => {
      const orders = [
        new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1')),
      ];

      mockOrderRepository.findAll.mockResolvedValue(orders);
      mockOrderRepository.count.mockResolvedValue(10);

      const result = await useCase.execute({ page: 2, limit: 5 });

      expect(result.success).toBe(true);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.totalPages).toBe(2);
      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5,
        })
      );
    });

    it('should filter by status', async () => {
      mockOrderRepository.findAll.mockResolvedValue([]);
      mockOrderRepository.count.mockResolvedValue(0);

      await useCase.execute({ status: OrderStatusEnum.PENDING });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.objectContaining({ value: OrderStatusEnum.PENDING }),
        })
      );
    });

    it('should filter by customer name', async () => {
      mockOrderRepository.findAll.mockResolvedValue([]);
      mockOrderRepository.count.mockResolvedValue(0);

      await useCase.execute({ customerName: 'John' });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John',
        })
      );
    });

    it('should handle empty results', async () => {
      mockOrderRepository.findAll.mockResolvedValue([]);
      mockOrderRepository.count.mockResolvedValue(0);

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle repository errors', async () => {
      mockOrderRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute({})).rejects.toThrow('Database error');
    });
  });
});
