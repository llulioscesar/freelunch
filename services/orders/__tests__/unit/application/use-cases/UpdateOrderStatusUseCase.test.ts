/**
 * Unit Tests: UpdateOrderStatusUseCase
 */
import { UpdateOrderStatusUseCase } from '../../../../src/application/use-cases/UpdateOrderStatusUseCase';
import { OrderRepository } from '../../../../src/domain/repositories/OrderRepository';
import { EventPublisher } from '../../../../src/application/ports/out/EventPublisher';
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

const mockEventPublisher: jest.Mocked<EventPublisher> = {
  publish: jest.fn(),
  publishBatch: jest.fn(),
};

// Mock logger
jest.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    logUseCaseStart: jest.fn(),
    logUseCaseEnd: jest.fn(),
    logUseCaseError: jest.fn(),
    logDomainEvent: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: {
    recordUseCaseExecution: jest.fn(),
  },
}));

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepository.update.mockResolvedValue(undefined);
    mockEventPublisher.publish.mockResolvedValue(undefined);
    useCase = new UpdateOrderStatusUseCase(mockOrderRepository, mockEventPublisher);
  });

  describe('execute', () => {
    it('should update order status to PREPARING', async () => {
      const orderId = new OrderId('ORD-1234567890-ABC123');
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));

      mockOrderRepository.findById.mockResolvedValue(order);

      const result = await useCase.execute({
        orderId: orderId.getValue(),
        status: OrderStatusEnum.PREPARING,
      });

      expect(result.success).toBe(true);
      expect(result.order?.status).toBe(OrderStatusEnum.PREPARING);
      expect(mockOrderRepository.update).toHaveBeenCalledWith(order);
    });

    it('should return error when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        orderId: 'ORD-9999999999-NOTFOUND',
        status: OrderStatusEnum.PREPARING,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it('should return error for invalid status', async () => {
      const orderId = new OrderId('ORD-1234567890-ABC123');
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));

      mockOrderRepository.findById.mockResolvedValue(order);

      const result = await useCase.execute({
        orderId: orderId.getValue(),
        status: 'INVALID_STATUS',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should publish events when status changes', async () => {
      const orderId = new OrderId('ORD-1234567890-ABC123');
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));

      mockOrderRepository.findById.mockResolvedValue(order);

      await useCase.execute({
        orderId: orderId.getValue(),
        status: OrderStatusEnum.PREPARING,
      });

      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });

    it('should handle repository update errors', async () => {
      const orderId = new OrderId('ORD-1234567890-ABC123');
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));

      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute({
        orderId: orderId.getValue(),
        status: OrderStatusEnum.PREPARING,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
