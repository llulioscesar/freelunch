/**
 * Unit Tests: GetOrderStatusUseCase
 */
import { GetOrderStatusUseCase } from '../../../../src/application/use-cases/GetOrderStatusUseCase';
import { OrderRepository } from '../../../../src/domain/repositories/OrderRepository';
import { Order } from '../../../../src/domain/entities/Order';
import { OrderId } from '../../../../src/domain/value-objects/OrderId';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';
import { CustomerInfo } from '../../../../src/domain/value-objects/CustomerInfo';

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

describe('GetOrderStatusUseCase', () => {
  let useCase: GetOrderStatusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepository.findById.mockResolvedValue(null);
    useCase = new GetOrderStatusUseCase(mockOrderRepository);
  });

  describe('execute', () => {
    it('should return order status when order exists', async () => {
      const orderId = new OrderId('ORD-1234567890-ABC123');
      const order = new Order(orderId, new Quantity(2), new CustomerInfo('John Doe'));

      mockOrderRepository.findById.mockResolvedValue(order);

      const result = await useCase.execute({ orderId: orderId.getValue() });

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order?.id).toBe(orderId.getValue());
      expect(result.order?.status).toBe('PENDING');
      expect(result.order?.quantity).toBe(2);
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
    });

    it('should return error when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({ orderId: 'ORD-9999999999-NOTFOUND' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
      expect(result.order).toBeUndefined();
    });

    it('should handle repository errors', async () => {
      mockOrderRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute({ orderId: 'ORD-1234567890-ABC123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should handle invalid order ID format', async () => {
      const result = await useCase.execute({ orderId: 'INVALID' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle errors without message property', async () => {
      mockOrderRepository.findById.mockRejectedValue({ code: 'UNKNOWN' });

      const result = await useCase.execute({ orderId: 'ORD-1234567890-ABC123' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get order status');
    });
  });
});
