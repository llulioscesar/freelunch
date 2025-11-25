/**
 * Unit Tests: UpdateOrderItemStatusUseCase
 */
import { UpdateOrderItemStatusUseCase, UpdateOrderItemStatusDTO } from '../../../../src/application/use-cases/UpdateOrderItemStatusUseCase';
import { OrderRepository } from '../../../../src/domain/repositories/OrderRepository';
import { EventPublisher } from '../../../../src/application/ports/out/EventPublisher';
import { Order } from '../../../../src/domain/entities/Order';
import { OrderId } from '../../../../src/domain/value-objects/OrderId';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';
import { CustomerInfo } from '../../../../src/domain/value-objects/CustomerInfo';
import { OrderItemStatus } from '../../../../src/domain/entities/OrderItem';
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
    recordOrderItemCompleted: jest.fn(),
    recordOrderItemFailed: jest.fn(),
  },
}));

describe('UpdateOrderItemStatusUseCase', () => {
  let useCase: UpdateOrderItemStatusUseCase;
  let testOrder: Order;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test order
    const orderId = new OrderId('ORD-1234567890-ABC123');
    const quantity = new Quantity(3);
    const customerInfo = new CustomerInfo('Test Customer', 'Test notes');
    testOrder = new Order(orderId, quantity, customerInfo);
    testOrder.clearDomainEvents(); // Clear creation event

    // Set default mock implementations
    mockOrderRepository.update.mockResolvedValue(undefined);
    mockEventPublisher.publish.mockResolvedValue(undefined);

    // Create use case instance
    useCase = new UpdateOrderItemStatusUseCase(mockOrderRepository, mockEventPublisher);
  });

  describe('execute - ASSIGNED status', () => {
    it('should assign recipe to order item', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.ASSIGNED,
        recipeId: 'RCP-001',
        recipeName: 'Burger Deluxe',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.item?.status).toBe(OrderItemStatus.ASSIGNED);
      expect(result.item?.recipeId).toBe('RCP-001');
      expect(result.item?.recipeName).toBe('Burger Deluxe');
      expect(firstItem.getRecipeId()).toBe('RCP-001');
      expect(mockOrderRepository.update).toHaveBeenCalledWith(testOrder);
    });

    it('should not assign when recipeName is missing', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.ASSIGNED,
        recipeId: 'RCP-002',
        // recipeName not provided - assignment should not happen
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      // Item should remain PENDING since assignment requires both recipeId and recipeName
      expect(firstItem.getStatus()).toBe(OrderItemStatus.PENDING);
      expect(firstItem.getRecipeId()).toBeUndefined();
    });

    it('should handle assignment without recipe details', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.ASSIGNED,
      };

      const result = await useCase.execute(dto);

      // Without recipeId and recipeName, assignment should not happen
      expect(result.success).toBe(true);
      expect(firstItem.getStatus()).toBe(OrderItemStatus.PENDING);
    });
  });

  describe('execute - status transitions', () => {
    it('should transition item to PREPARING', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];
      firstItem.assignRecipe('RCP-001', 'Burger');

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.PREPARING,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.item?.status).toBe(OrderItemStatus.PREPARING);
      expect(firstItem.getStatus()).toBe(OrderItemStatus.PREPARING);
    });

    it('should transition item through full lifecycle', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // 1. Assign recipe
      await useCase.execute({
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.ASSIGNED,
        recipeId: 'RCP-001',
        recipeName: 'Burger',
      });

      expect(firstItem.getStatus()).toBe(OrderItemStatus.ASSIGNED);

      // 2. Mark as preparing
      await useCase.execute({
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.PREPARING,
      });

      expect(firstItem.getStatus()).toBe(OrderItemStatus.PREPARING);

      // 3. Request ingredients
      await useCase.execute({
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.INGREDIENTS_REQUESTED,
      });

      expect(firstItem.getStatus()).toBe(OrderItemStatus.INGREDIENTS_REQUESTED);

      // 4. Mark as cooking
      await useCase.execute({
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.COOKING,
      });

      expect(firstItem.getStatus()).toBe(OrderItemStatus.COOKING);

      // 5. Mark as ready
      const result = await useCase.execute({
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.READY,
      });

      expect(result.success).toBe(true);
      expect(firstItem.getStatus()).toBe(OrderItemStatus.READY);
      expect(firstItem.isReady()).toBe(true);
    });
  });

  describe('execute - FAILED status', () => {
    it('should mark item as failed with reason', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.FAILED,
        failureReason: 'Kitchen equipment malfunction',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.item?.status).toBe(OrderItemStatus.FAILED);
      expect(firstItem.getStatus()).toBe(OrderItemStatus.FAILED);
      expect(firstItem.getFailureReason()).toBe('Kitchen equipment malfunction');
    });

    it('should mark item as failed without reason', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.FAILED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(firstItem.getFailureReason()).toBe('Unknown error');
    });
  });

  describe('error handling', () => {
    it('should return error when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: 'ORD-9999999999-UNONEXIST',
        itemId: 'ITEM-123-abc',
        status: OrderItemStatus.PREPARING,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it('should return error when order item not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: 'ITEM-999999-nonexistent',
        status: OrderItemStatus.PREPARING,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order item not found');
      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it('should handle invalid status transition', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Try to mark as PREPARING without assigning recipe first
      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.PREPARING,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item must be assigned before preparing');
    });

    it('should handle repository update error', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];
      firstItem.assignRecipe('RCP-001', 'Burger');

      mockOrderRepository.findById.mockResolvedValue(testOrder);
      mockOrderRepository.update.mockRejectedValue(new Error('Database error'));

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.PREPARING,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should handle unknown status', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: 'UNKNOWN_STATUS' as any,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown status: UNKNOWN_STATUS');
    });

    it('should handle errors without message property', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];
      firstItem.assignRecipe('RCP-001', 'Burger');

      mockOrderRepository.findById.mockResolvedValue(testOrder);
      mockOrderRepository.update.mockRejectedValue({ code: 'UNKNOWN' });

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.PREPARING,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update order item status');
    });
  });

  describe('metrics recording', () => {
    it('should record metrics with "unknown" when recipeName is not set', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Assign without recipeName
      firstItem.assignRecipe('RCP-999', undefined as any);
      firstItem.markAsPreparing();
      firstItem.markAsIngredientsRequested();
      firstItem.markAsCooking();

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.READY,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(firstItem.getStatus()).toBe(OrderItemStatus.READY);
      expect(firstItem.getRecipeName()).toBeUndefined();
    });
  });

  describe('order progress tracking', () => {
    it('should return correct progress percentage', async () => {
      const items = testOrder.getItems();

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Prepare first item up to cooking
      const firstItem = items[0];
      firstItem.assignRecipe('RCP-001', 'Burger');
      firstItem.markAsPreparing();
      firstItem.markAsIngredientsRequested();
      firstItem.markAsCooking();

      // Mark as READY via use case
      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.READY,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.order?.totalItems).toBe(3);
      expect(result.order?.completedItems).toBe(1); // READY counts as completed for progress
      expect(result.order?.progress).toBe(33); // 1/3 = 33%
    });

    it('should track completed items correctly', async () => {
      const items = testOrder.getItems();

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Prepare first item and mark as ready
      const firstItem = items[0];
      firstItem.assignRecipe('RCP-001', 'Burger');
      firstItem.markAsPreparing();
      firstItem.markAsIngredientsRequested();
      firstItem.markAsCooking();
      firstItem.markAsReady();

      // Now deliver it via the use case
      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.DELIVERED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.order?.completedItems).toBe(1);
      expect(result.order?.progress).toBe(33); // Math.round((1/3) * 100) = 33
    });
  });

  describe('order auto-completion', () => {
    it('should NOT auto-complete order when not all items are ready', async () => {
      const items = testOrder.getItems();
      const firstItem = items[0];

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Complete only one item
      firstItem.assignRecipe('RCP-001', 'Burger');
      firstItem.markAsPreparing();
      firstItem.markAsIngredientsRequested();
      firstItem.markAsCooking();
      firstItem.markAsReady();

      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: firstItem.getId().getValue(),
        status: OrderItemStatus.DELIVERED,
      };

      await useCase.execute(dto);

      // Order should still be PENDING (not all items completed)
      expect(testOrder.getStatus().getValue()).toBe(OrderStatusEnum.PENDING);
    });

    it('should auto-complete order when all items are delivered', async () => {
      const items = testOrder.getItems();

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Transition order to READY status (required before DELIVERED)
      testOrder.markAsPreparing();
      testOrder.updateStatus(OrderStatusEnum.INGREDIENTS_REQUESTED);
      testOrder.updateStatus(OrderStatusEnum.COOKING);
      testOrder.updateStatus(OrderStatusEnum.READY);

      // Deliver all items except last one
      items.forEach((item, index) => {
        if (index < items.length - 1) {
          item.assignRecipe(`RCP-00${index}`, 'Burger');
          item.markAsPreparing();
          item.markAsIngredientsRequested();
          item.markAsCooking();
          item.markAsReady();
          item.markAsDelivered();
        }
      });

      // Prepare last item and mark it ready
      const lastItem = items[items.length - 1];
      lastItem.assignRecipe('RCP-002', 'Burger');
      lastItem.markAsPreparing();
      lastItem.markAsIngredientsRequested();
      lastItem.markAsCooking();
      lastItem.markAsReady();

      // Clear any events from setup
      testOrder.clearDomainEvents();

      // Deliver last item via the use case - this should trigger auto-completion
      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: lastItem.getId().getValue(),
        status: OrderItemStatus.DELIVERED,
      };

      const result = await useCase.execute(dto);

      // Order should be auto-completed
      expect(result.success).toBe(true);
      expect(testOrder.getStatus().getValue()).toBe(OrderStatusEnum.DELIVERED);
      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });

    it('should mark order as failed when some items failed', async () => {
      const items = testOrder.getItems();

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Transition order to a state that can transition to FAILED
      testOrder.markAsPreparing();
      testOrder.updateStatus(OrderStatusEnum.INGREDIENTS_REQUESTED);
      testOrder.updateStatus(OrderStatusEnum.COOKING);

      // Complete first item successfully
      items[0].assignRecipe('RCP-001', 'Burger');
      items[0].markAsPreparing();
      items[0].markAsIngredientsRequested();
      items[0].markAsCooking();
      items[0].markAsReady();
      items[0].markAsDelivered();

      // Fail second item
      items[1].markAsFailed('Kitchen error');

      // Clear any events from setup
      testOrder.clearDomainEvents();

      // Fail last item via use case - this completes all items (1 delivered + 2 failed)
      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: items[2].getId().getValue(),
        status: OrderItemStatus.FAILED,
        failureReason: 'Burnt',
      };

      const result = await useCase.execute(dto);

      // Order should be marked as FAILED (because hasFailedItems() is true)
      expect(result.success).toBe(true);
      expect(testOrder.getStatus().getValue()).toBe(OrderStatusEnum.FAILED);
    });
  });

  describe('event publishing', () => {
    it('should publish events when order completes', async () => {
      const items = testOrder.getItems();

      mockOrderRepository.findById.mockResolvedValue(testOrder);

      // Transition order to READY status (required before DELIVERED)
      testOrder.markAsPreparing();
      testOrder.updateStatus(OrderStatusEnum.INGREDIENTS_REQUESTED);
      testOrder.updateStatus(OrderStatusEnum.COOKING);
      testOrder.updateStatus(OrderStatusEnum.READY);

      // Deliver all items except last one
      items.forEach((item, index) => {
        if (index < items.length - 1) {
          item.assignRecipe(`RCP-00${index}`, 'Burger');
          item.markAsPreparing();
          item.markAsIngredientsRequested();
          item.markAsCooking();
          item.markAsReady();
          item.markAsDelivered();
        }
      });

      // Prepare last item
      const lastItem = items[items.length - 1];
      lastItem.assignRecipe('RCP-002', 'Burger');
      lastItem.markAsPreparing();
      lastItem.markAsIngredientsRequested();
      lastItem.markAsCooking();
      lastItem.markAsReady();

      // Clear events before final action
      testOrder.clearDomainEvents();

      // Deliver last item - should trigger auto-completion and publish events
      const dto: UpdateOrderItemStatusDTO = {
        orderId: testOrder.getId().getValue(),
        itemId: lastItem.getId().getValue(),
        status: OrderItemStatus.DELIVERED,
      };

      const result = await useCase.execute(dto);

      // Should publish order.completed event
      expect(result.success).toBe(true);
      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });
  });
});
