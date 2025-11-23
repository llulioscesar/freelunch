/**
 * Unit Tests: Order Entity
 */
import { Order } from '../../../../src/domain/entities/Order';
import { OrderId } from '../../../../src/domain/value-objects/OrderId';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';
import { CustomerInfo } from '../../../../src/domain/value-objects/CustomerInfo';
import { OrderStatus, OrderStatusEnum } from '../../../../src/domain/value-objects/OrderStatus';
import { OrderItemStatus } from '../../../../src/domain/entities/OrderItem';

describe('Order Entity', () => {
  let orderId: OrderId;
  let quantity: Quantity;
  let customerInfo: CustomerInfo;

  beforeEach(() => {
    orderId = new OrderId();
    quantity = new Quantity(5);
    customerInfo = new CustomerInfo('John Doe', 'No onions');
  });

  // Helper function to transition order through valid states to READY
  const transitionToReady = (order: Order) => {
    order.updateStatus(OrderStatusEnum.PREPARING);
    order.updateStatus(OrderStatusEnum.INGREDIENTS_REQUESTED);
    order.updateStatus(OrderStatusEnum.COOKING);
    order.updateStatus(OrderStatusEnum.READY);
  };

  describe('constructor', () => {
    it('should create a new order with default PENDING status', () => {
      const order = new Order(orderId, quantity, customerInfo);

      expect(order.getId()).toBe(orderId);
      expect(order.getQuantity()).toBe(quantity);
      expect(order.getCustomerInfo()).toBe(customerInfo);
      expect(order.getStatus().getValue()).toBe(OrderStatusEnum.PENDING);
    });

    it('should create N order items for N quantity', () => {
      const order = new Order(orderId, new Quantity(5), customerInfo);

      expect(order.getTotalItems()).toBe(5);
      expect(order.getItems().length).toBe(5);
    });

    it('should initialize all items as PENDING', () => {
      const order = new Order(orderId, quantity, customerInfo);
      const items = order.getItems();

      items.forEach(item => {
        expect(item.getStatus()).toBe(OrderItemStatus.PENDING);
      });
    });

    it('should emit OrderCreatedEvent for new orders', () => {
      const order = new Order(orderId, quantity, customerInfo);
      const events = order.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventName()).toBe('order.created');
    });

    it('should not emit event for existing orders', () => {
      const status = new OrderStatus(OrderStatusEnum.PREPARING);
      const order = new Order(orderId, quantity, customerInfo, status, new Date());

      expect(order.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('updateStatus', () => {
    it('should update status to a valid next status', () => {
      const order = new Order(orderId, quantity, customerInfo);

      order.updateStatus(OrderStatusEnum.PREPARING);

      expect(order.getStatus().getValue()).toBe(OrderStatusEnum.PREPARING);
    });

    it('should emit OrderStatusChangedEvent when status changes', () => {
      const order = new Order(orderId, quantity, customerInfo);
      order.clearDomainEvents(); // Clear creation event

      order.updateStatus(OrderStatusEnum.PREPARING);
      const events = order.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventName()).toBe('order.status.changed');
    });

    it('should throw error for invalid transition', () => {
      const order = new Order(orderId, quantity, customerInfo);

      expect(() => order.updateStatus(OrderStatusEnum.DELIVERED)).toThrow('Cannot transition');
    });

    it('should set completedAt for final statuses', () => {
      const order = new Order(orderId, quantity, customerInfo);
      transitionToReady(order);

      expect(order.getCompletedAt()).toBeUndefined();

      order.updateStatus(OrderStatusEnum.DELIVERED);

      expect(order.getCompletedAt()).toBeInstanceOf(Date);
    });
  });

  describe('mark methods', () => {
    it('markAsPreparing should update status to PREPARING', () => {
      const order = new Order(orderId, quantity, customerInfo);

      order.markAsPreparing();

      expect(order.getStatus().getValue()).toBe(OrderStatusEnum.PREPARING);
    });

    it('markAsReady should update status to READY', () => {
      const order = new Order(orderId, quantity, customerInfo);
      order.updateStatus(OrderStatusEnum.PREPARING);
      order.updateStatus(OrderStatusEnum.INGREDIENTS_REQUESTED);
      order.updateStatus(OrderStatusEnum.COOKING);
      order.markAsReady();

      expect(order.getStatus().getValue()).toBe(OrderStatusEnum.READY);
    });

    it('markAsDelivered should emit OrderCompletedEvent', () => {
      const order = new Order(orderId, quantity, customerInfo);
      transitionToReady(order);
      order.clearDomainEvents();

      order.markAsDelivered();
      const events = order.getDomainEvents();

      const completedEvent = events.find(e => e.eventName() === 'order.completed');
      expect(completedEvent).toBeDefined();
    });

    it('markAsFailed should emit OrderFailedEvent', () => {
      const order = new Order(orderId, quantity, customerInfo);
      order.markAsPreparing(); // First transition to PREPARING (valid state for FAILED)
      order.clearDomainEvents();

      order.markAsFailed('Kitchen error');
      const events = order.getDomainEvents();

      const failedEvent = events.find(e => e.eventName() === 'order.failed');
      expect(failedEvent).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending order', () => {
      const order = new Order(orderId, quantity, customerInfo);

      order.cancel();

      expect(order.getStatus().getValue()).toBe(OrderStatusEnum.CANCELLED);
    });

    it('should throw error when trying to cancel completed order', () => {
      const order = new Order(orderId, quantity, customerInfo);
      transitionToReady(order);
      order.markAsDelivered();

      expect(() => order.cancel()).toThrow('Cannot cancel a completed order');
    });
  });

  describe('business rules', () => {
    it('isPending should return true for PENDING orders', () => {
      const order = new Order(orderId, quantity, customerInfo);

      expect(order.isPending()).toBe(true);
    });

    it('isCompleted should return true for final statuses', () => {
      const order = new Order(orderId, quantity, customerInfo);

      expect(order.isCompleted()).toBe(false);

      transitionToReady(order);
      order.markAsDelivered();

      expect(order.isCompleted()).toBe(true);
    });

    it('canBeCancelled should return false for final orders', () => {
      const order = new Order(orderId, quantity, customerInfo);

      expect(order.canBeCancelled()).toBe(true);

      transitionToReady(order);
      order.markAsDelivered();

      expect(order.canBeCancelled()).toBe(false);
    });

    it('requiresUrgentAttention should return true for old pending orders', () => {
      const oldDate = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
      const order = new Order(orderId, quantity, customerInfo, undefined, oldDate);

      expect(order.requiresUrgentAttention()).toBe(true);
    });

    it('requiresUrgentAttention should return false for recent orders', () => {
      const order = new Order(orderId, quantity, customerInfo);

      expect(order.requiresUrgentAttention()).toBe(false);
    });
  });

  describe('order items tracking', () => {
    it('getTotalItems should return quantity', () => {
      const order = new Order(orderId, new Quantity(10), customerInfo);

      expect(order.getTotalItems()).toBe(10);
    });

    it('getCompletedItems should return count of completed items', () => {
      const order = new Order(orderId, new Quantity(3), customerInfo);
      const items = order.getItems();

      // Mark first item as delivered
      items[0].assignRecipe('RCP-001', 'Burger');
      items[0].markAsPreparing();
      items[0].markAsIngredientsRequested();
      items[0].markAsCooking();
      items[0].markAsReady();
      items[0].markAsDelivered();

      expect(order.getCompletedItems()).toBe(1);
      expect(order.getPendingItems()).toBe(2);
    });

    it('getProgressPercentage should calculate correctly', () => {
      const order = new Order(orderId, new Quantity(4), customerInfo);
      const items = order.getItems();

      expect(order.getProgressPercentage()).toBe(0);

      // Complete 2 out of 4 items
      for (let i = 0; i < 2; i++) {
        items[i].assignRecipe('RCP-001', 'Burger');
        items[i].markAsPreparing();
        items[i].markAsIngredientsRequested();
        items[i].markAsCooking();
        items[i].markAsReady();
        items[i].markAsDelivered();
      }

      expect(order.getProgressPercentage()).toBe(50);
    });

    it('isFullyCompleted should return true when all items completed', () => {
      const order = new Order(orderId, new Quantity(2), customerInfo);
      const items = order.getItems();

      expect(order.isFullyCompleted()).toBe(false);

      // Complete all items
      items.forEach(item => {
        item.assignRecipe('RCP-001', 'Burger');
        item.markAsPreparing();
        item.markAsIngredientsRequested();
        item.markAsCooking();
        item.markAsReady();
        item.markAsDelivered();
      });

      expect(order.isFullyCompleted()).toBe(true);
    });

    it('hasFailedItems should return true if any item failed', () => {
      const order = new Order(orderId, new Quantity(3), customerInfo);
      const items = order.getItems();

      expect(order.hasFailedItems()).toBe(false);

      items[0].markAsFailed('Kitchen error');

      expect(order.hasFailedItems()).toBe(true);
    });
  });

  describe('getItemById', () => {
    it('should find item by ID', () => {
      const order = new Order(orderId, quantity, customerInfo);
      const items = order.getItems();
      const firstItemId = items[0].getId();

      const found = order.getItemById(firstItemId);

      expect(found).toBe(items[0]);
    });

    it('should return undefined for non-existent ID', () => {
      const order = new Order(orderId, quantity, customerInfo);
      const nonExistentId = new (require('../../../../src/domain/value-objects/OrderItemId').OrderItemId)();

      const found = order.getItemById(nonExistentId);

      expect(found).toBeUndefined();
    });
  });

  describe('toPrimitives', () => {
    it('should serialize order to primitives', () => {
      const order = new Order(orderId, quantity, customerInfo);
      const primitives = order.toPrimitives();

      expect(primitives).toMatchObject({
        id: orderId.getValue(),
        quantity: 5,
        customerName: 'John Doe',
        notes: 'No onions',
        status: 'PENDING',
        totalItems: 5,
        completedItems: 0,
        progress: 0,
      });

      expect(primitives.items).toHaveLength(5);
      expect(primitives.createdAt).toBeDefined();
    });
  });

  describe('fromPrimitives', () => {
    it('should deserialize order from primitives', () => {
      const primitives = {
        id: 'ORD-1234567890-UABC123',
        quantity: 3,
        customerName: 'Jane Doe',
        notes: 'Extra sauce',
        status: 'PREPARING',
        createdAt: new Date().toISOString(),
        completedAt: null,
        updatedAt: new Date().toISOString(),
        items: [],
      };

      const order = Order.fromPrimitives(primitives);

      expect(order.getId().getValue()).toBe(primitives.id);
      expect(order.getQuantity().getValue()).toBe(primitives.quantity);
      expect(order.getCustomerInfo().getName()).toBe(primitives.customerName);
      expect(order.getStatus().getValue()).toBe('PREPARING');
    });

    it('should deserialize order with completedAt', () => {
      const completedDate = new Date();
      const primitives = {
        id: 'ORD-1234567890-ABC123',
        quantity: 2,
        customerName: 'Test User',
        notes: null,
        status: 'DELIVERED',
        createdAt: new Date().toISOString(),
        completedAt: completedDate.toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };

      const order = Order.fromPrimitives(primitives);

      expect(order.getStatus().getValue()).toBe('DELIVERED');
      expect(order.isCompleted()).toBe(true);
    });

    it('should deserialize order without completedAt', () => {
      const primitives = {
        id: 'ORD-1234567890-ABC123',
        quantity: 2,
        customerName: 'Test User',
        notes: null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        completedAt: null,
        updatedAt: new Date().toISOString(),
        items: [],
      };

      const order = Order.fromPrimitives(primitives);

      expect(order.isPending()).toBe(true);
    });
  });

  describe('getReadyItems', () => {
    it('should return count of ready items', () => {
      const order = new Order(orderId, new Quantity(3), customerInfo);
      const items = order.getItems();

      // Transition items through proper states to READY
      items[0].assignRecipe('RECIPE-1', 'Recipe One');
      items[0].markAsPreparing();
      items[0].markAsIngredientsRequested();
      items[0].markAsCooking();
      items[0].markAsReady();

      items[1].assignRecipe('RECIPE-2', 'Recipe Two');
      items[1].markAsPreparing();
      items[1].markAsIngredientsRequested();
      items[1].markAsCooking();
      items[1].markAsReady();

      expect(order.getReadyItems()).toBe(2);
    });
  });

  describe('getEstimatedPreparationTime', () => {
    it('should return estimated preparation time based on quantity', () => {
      const order = new Order(orderId, new Quantity(5), customerInfo);

      const estimatedTime = order.getEstimatedPreparationTime();

      expect(estimatedTime).toBeGreaterThan(0);
    });
  });
});
