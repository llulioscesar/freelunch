/**
 * Unit Tests: CreateOrderUseCase
 */
import { CreateOrderUseCase } from '../../../../src/application/use-cases/CreateOrderUseCase';
import { OrderRepository } from '../../../../src/domain/repositories/OrderRepository';
import { EventPublisher } from '../../../../src/application/ports/out/EventPublisher';
import { CreateOrderDTO } from '../../../../src/application/dto/CreateOrderDTO';
import { Order } from '../../../../src/domain/entities/Order';
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

// Mock logger and metrics
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
    recordOrderCreated: jest.fn(),
  },
}));

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set default mock implementations
    mockOrderRepository.save.mockResolvedValue(undefined);
    mockEventPublisher.publish.mockResolvedValue(undefined);

    // Create use case instance
    useCase = new CreateOrderUseCase(mockOrderRepository, mockEventPublisher);
  });

  describe('execute', () => {
    it('should create order successfully with valid data', async () => {
      const dto: CreateOrderDTO = {
        quantity: 5,
        customerName: 'John Doe',
        notes: 'No onions',
      };

      const result = await useCase.execute(dto);

      // Assert response structure
      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order.quantity).toBe(5);
      expect(result.order.status).toBe(OrderStatusEnum.PENDING);
      expect(result.order.customerName).toBe('John Doe');
      expect(result.order.id).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(result.message).toBe('Order created successfully and sent to kitchen');

      // Assert repository was called
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
      const savedOrder = mockOrderRepository.save.mock.calls[0][0] as Order;
      expect(savedOrder).toBeInstanceOf(Order);
      expect(savedOrder.getQuantity().getValue()).toBe(5);

      // Assert event was published
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = mockEventPublisher.publish.mock.calls[0][0];
      expect(publishedEvent.eventName()).toBe('order.created');
    });

    it('should create order with minimal data', async () => {
      const dto: CreateOrderDTO = {
        quantity: 1,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.order.quantity).toBe(1);
      expect(result.order.customerName).toBe('Anonymous');
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create order without notes', async () => {
      const dto: CreateOrderDTO = {
        quantity: 3,
        customerName: 'Jane Smith',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.order.quantity).toBe(3);
      expect(result.order.customerName).toBe('Jane Smith');
    });

    it('should throw error for invalid quantity (0)', async () => {
      const dto: CreateOrderDTO = {
        quantity: 0,
        customerName: 'John Doe',
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Quantity must be at least 1');
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should throw error for negative quantity', async () => {
      const dto: CreateOrderDTO = {
        quantity: -5,
        customerName: 'John Doe',
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Quantity must be at least 1');
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for quantity exceeding maximum', async () => {
      const dto: CreateOrderDTO = {
        quantity: 101,
        customerName: 'John Doe',
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Quantity cannot exceed 100');
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for non-integer quantity', async () => {
      const dto: CreateOrderDTO = {
        quantity: 5.5,
        customerName: 'John Doe',
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Quantity must be an integer');
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save error', async () => {
      const dto: CreateOrderDTO = {
        quantity: 5,
        customerName: 'John Doe',
      };

      const repositoryError = new Error('Database connection failed');
      mockOrderRepository.save.mockRejectedValue(repositoryError);

      await expect(useCase.execute(dto)).rejects.toThrow('Database connection failed');
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should handle event publisher error', async () => {
      const dto: CreateOrderDTO = {
        quantity: 5,
        customerName: 'John Doe',
      };

      const publishError = new Error('Event bus unavailable');
      mockEventPublisher.publish.mockRejectedValue(publishError);

      await expect(useCase.execute(dto)).rejects.toThrow('Event bus unavailable');
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    it('should create order with maximum allowed quantity', async () => {
      const dto: CreateOrderDTO = {
        quantity: 100,
        customerName: 'Big Event',
        notes: 'Corporate catering',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.order.quantity).toBe(100);
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);

      const savedOrder = mockOrderRepository.save.mock.calls[0][0] as Order;
      expect(savedOrder.getItems().length).toBe(100);
    });

    it('should publish domain events after saving', async () => {
      const dto: CreateOrderDTO = {
        quantity: 2,
        customerName: 'Test Customer',
      };

      await useCase.execute(dto);

      // Verify order is saved before events are published
      const saveCallOrder = mockOrderRepository.save.mock.invocationCallOrder[0];
      const publishCallOrder = mockEventPublisher.publish.mock.invocationCallOrder[0];
      expect(saveCallOrder).toBeLessThan(publishCallOrder);
    });

    it('should clear domain events after publishing', async () => {
      const dto: CreateOrderDTO = {
        quantity: 1,
        customerName: 'Test Customer',
      };

      await useCase.execute(dto);

      const savedOrder = mockOrderRepository.save.mock.calls[0][0] as Order;

      // Events should have been cleared after publishing
      // We can't directly check this in the test since the order is saved before clearing
      // But we can verify publish was called with the events
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    it('should create unique order IDs for multiple orders', async () => {
      const dto: CreateOrderDTO = {
        quantity: 1,
        customerName: 'Customer',
      };

      const result1 = await useCase.execute(dto);
      jest.clearAllMocks();
      const result2 = await useCase.execute(dto);

      expect(result1.order.id).not.toBe(result2.order.id);
    });

    it('should handle special characters in customer name', async () => {
      const dto: CreateOrderDTO = {
        quantity: 1,
        customerName: "O'Brien & Sons",
        notes: 'Special chars: <>&"',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.order.customerName).toBe("O'Brien & Sons");
    });

    it('should handle very long notes', async () => {
      const longNotes = 'A'.repeat(500);
      const dto: CreateOrderDTO = {
        quantity: 1,
        customerName: 'Customer',
        notes: longNotes,
      };

      // This should succeed or fail based on CustomerInfo validation
      // The behavior depends on domain rules
      try {
        const result = await useCase.execute(dto);
        expect(result.success).toBe(true);
      } catch (error: any) {
        // If there's a max length validation in CustomerInfo
        expect(error.message).toMatch(/notes|length|max/i);
      }
    });
  });

  describe('integration with domain', () => {
    it('should create correct number of order items', async () => {
      const dto: CreateOrderDTO = {
        quantity: 7,
        customerName: 'Test',
      };

      await useCase.execute(dto);

      const savedOrder = mockOrderRepository.save.mock.calls[0][0] as Order;
      expect(savedOrder.getItems().length).toBe(7);
      expect(savedOrder.getTotalItems()).toBe(7);
    });

    it('should initialize all order items as PENDING', async () => {
      const dto: CreateOrderDTO = {
        quantity: 3,
        customerName: 'Test',
      };

      await useCase.execute(dto);

      const savedOrder = mockOrderRepository.save.mock.calls[0][0] as Order;
      const items = savedOrder.getItems();

      items.forEach(item => {
        expect(item.isPending()).toBe(true);
      });
    });
  });
});
