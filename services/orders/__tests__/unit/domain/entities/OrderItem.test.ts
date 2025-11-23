/**
 * Unit Tests: OrderItem Entity
 */
import { OrderItem, OrderItemStatus } from '../../../../src/domain/entities/OrderItem';
import { OrderItemId } from '../../../../src/domain/value-objects/OrderItemId';
import { OrderId } from '../../../../src/domain/value-objects/OrderId';

describe('OrderItem Entity', () => {
  let itemId: OrderItemId;
  let orderId: OrderId;

  beforeEach(() => {
    itemId = new OrderItemId();
    orderId = new OrderId();
  });

  describe('constructor', () => {
    it('should create a new order item with default PENDING status', () => {
      const item = new OrderItem(itemId, orderId);

      expect(item.getId()).toBe(itemId);
      expect(item.getOrderId()).toBe(orderId);
      expect(item.getStatus()).toBe(OrderItemStatus.PENDING);
      expect(item.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create order item with specific status', () => {
      const item = new OrderItem(itemId, orderId, OrderItemStatus.ASSIGNED);

      expect(item.getStatus()).toBe(OrderItemStatus.ASSIGNED);
    });

    it('should use provided createdAt date', () => {
      const customDate = new Date('2025-01-01T10:00:00Z');
      const item = new OrderItem(itemId, orderId, OrderItemStatus.PENDING, customDate);

      expect(item.getCreatedAt()).toBe(customDate);
    });
  });

  describe('assignRecipe', () => {
    it('should assign recipe to pending item', () => {
      const item = new OrderItem(itemId, orderId);

      item.assignRecipe('RCP-001', 'Burger Deluxe');

      expect(item.getRecipeId()).toBe('RCP-001');
      expect(item.getRecipeName()).toBe('Burger Deluxe');
      expect(item.getStatus()).toBe(OrderItemStatus.ASSIGNED);
      expect(item.getAssignedAt()).toBeInstanceOf(Date);
    });

    it('should throw error when assigning recipe to non-pending item', () => {
      const item = new OrderItem(itemId, orderId, OrderItemStatus.PREPARING);

      expect(() => item.assignRecipe('RCP-001', 'Burger')).toThrow('Can only assign recipe to pending items');
    });
  });

  describe('status transitions', () => {
    it('should transition from ASSIGNED to PREPARING', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');

      item.markAsPreparing();

      expect(item.getStatus()).toBe(OrderItemStatus.PREPARING);
    });

    it('should throw error when marking as preparing from non-assigned status', () => {
      const item = new OrderItem(itemId, orderId);

      expect(() => item.markAsPreparing()).toThrow('Item must be assigned before preparing');
    });

    it('should transition from PREPARING to INGREDIENTS_REQUESTED', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();

      item.markAsIngredientsRequested();

      expect(item.getStatus()).toBe(OrderItemStatus.INGREDIENTS_REQUESTED);
    });

    it('should throw error when requesting ingredients from non-preparing status', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');

      expect(() => item.markAsIngredientsRequested()).toThrow('Item must be preparing to request ingredients');
    });

    it('should transition from INGREDIENTS_REQUESTED to COOKING', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();

      item.markAsCooking();

      expect(item.getStatus()).toBe(OrderItemStatus.COOKING);
    });

    it('should throw error when marking as cooking from non-ingredients-requested status', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();

      expect(() => item.markAsCooking()).toThrow('Ingredients must be requested before cooking');
    });

    it('should transition from COOKING to READY', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();

      item.markAsReady();

      expect(item.getStatus()).toBe(OrderItemStatus.READY);
      expect(item.getPreparedAt()).toBeInstanceOf(Date);
    });

    it('should throw error when marking as ready from non-cooking status', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();

      expect(() => item.markAsReady()).toThrow('Item must be cooking to mark as ready');
    });

    it('should transition from READY to DELIVERED', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();
      item.markAsReady();

      item.markAsDelivered();

      expect(item.getStatus()).toBe(OrderItemStatus.DELIVERED);
      expect(item.getDeliveredAt()).toBeInstanceOf(Date);
    });

    it('should throw error when marking as delivered from non-ready status', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();

      expect(() => item.markAsDelivered()).toThrow('Item must be ready to deliver');
    });
  });

  describe('markAsFailed', () => {
    it('should mark item as failed from any status', () => {
      const item = new OrderItem(itemId, orderId);

      item.markAsFailed('Kitchen equipment failure');

      expect(item.getStatus()).toBe(OrderItemStatus.FAILED);
      expect(item.getFailureReason()).toBe('Kitchen equipment failure');
    });

    it('should mark item as failed during cooking', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();

      item.markAsFailed('Burnt');

      expect(item.getStatus()).toBe(OrderItemStatus.FAILED);
      expect(item.getFailureReason()).toBe('Burnt');
    });
  });

  describe('business rules', () => {
    it('isPending should return true for PENDING status', () => {
      const item = new OrderItem(itemId, orderId);

      expect(item.isPending()).toBe(true);
    });

    it('isPending should return false for non-PENDING status', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');

      expect(item.isPending()).toBe(false);
    });

    it('isReady should return true for READY status', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();
      item.markAsReady();

      expect(item.isReady()).toBe(true);
    });

    it('isDelivered should return true for DELIVERED status', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();
      item.markAsReady();
      item.markAsDelivered();

      expect(item.isDelivered()).toBe(true);
    });

    it('isFailed should return true for FAILED status', () => {
      const item = new OrderItem(itemId, orderId);
      item.markAsFailed('Test failure');

      expect(item.isFailed()).toBe(true);
    });

    it('isCompleted should return true for DELIVERED items', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();
      item.markAsReady();
      item.markAsDelivered();

      expect(item.isCompleted()).toBe(true);
    });

    it('isCompleted should return true for FAILED items', () => {
      const item = new OrderItem(itemId, orderId);
      item.markAsFailed('Test failure');

      expect(item.isCompleted()).toBe(true);
    });

    it('isCompleted should return false for non-final items', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();

      expect(item.isCompleted()).toBe(false);
    });
  });

  describe('getPreparationTime', () => {
    it('should return null when item not yet prepared', () => {
      const item = new OrderItem(itemId, orderId);

      expect(item.getPreparationTime()).toBeNull();
    });

    it('should calculate preparation time in seconds', () => {
      const startTime = new Date('2025-01-01T10:00:00Z');
      const item = new OrderItem(itemId, orderId, OrderItemStatus.PENDING, startTime);

      // Manually set preparedAt for testing
      item.assignRecipe('RCP-001', 'Burger');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();

      // Wait a bit to simulate preparation time
      const endTime = new Date('2025-01-01T10:05:30Z'); // 5 minutes 30 seconds later
      jest.spyOn(global, 'Date').mockImplementation(() => endTime as any);

      item.markAsReady();

      const prepTime = item.getPreparationTime();
      expect(prepTime).toBe(330); // 5 minutes 30 seconds = 330 seconds

      jest.restoreAllMocks();
    });
  });

  describe('complete lifecycle test', () => {
    it('should transition through complete happy path', () => {
      const item = new OrderItem(itemId, orderId);

      // Initial state
      expect(item.getStatus()).toBe(OrderItemStatus.PENDING);
      expect(item.isPending()).toBe(true);

      // Assign recipe
      item.assignRecipe('RCP-001', 'Burger Deluxe');
      expect(item.getStatus()).toBe(OrderItemStatus.ASSIGNED);
      expect(item.getRecipeId()).toBe('RCP-001');
      expect(item.getAssignedAt()).toBeInstanceOf(Date);

      // Mark as preparing
      item.markAsPreparing();
      expect(item.getStatus()).toBe(OrderItemStatus.PREPARING);

      // Request ingredients
      item.markAsIngredientsRequested();
      expect(item.getStatus()).toBe(OrderItemStatus.INGREDIENTS_REQUESTED);

      // Start cooking
      item.markAsCooking();
      expect(item.getStatus()).toBe(OrderItemStatus.COOKING);

      // Mark as ready
      item.markAsReady();
      expect(item.getStatus()).toBe(OrderItemStatus.READY);
      expect(item.isReady()).toBe(true);
      expect(item.getPreparedAt()).toBeInstanceOf(Date);

      // Deliver
      item.markAsDelivered();
      expect(item.getStatus()).toBe(OrderItemStatus.DELIVERED);
      expect(item.isDelivered()).toBe(true);
      expect(item.isCompleted()).toBe(true);
      expect(item.getDeliveredAt()).toBeInstanceOf(Date);
    });
  });

  describe('toPrimitives', () => {
    it('should serialize pending item to primitives', () => {
      const item = new OrderItem(itemId, orderId);
      const primitives = item.toPrimitives();

      expect(primitives).toMatchObject({
        id: itemId.getValue(),
        orderId: orderId.getValue(),
        status: OrderItemStatus.PENDING,
      });

      expect(primitives.createdAt).toBeDefined();
      expect(primitives.recipeId).toBeUndefined();
      expect(primitives.assignedAt).toBeUndefined();
    });

    it('should serialize completed item to primitives', () => {
      const item = new OrderItem(itemId, orderId);
      item.assignRecipe('RCP-001', 'Burger Deluxe');
      item.markAsPreparing();
      item.markAsIngredientsRequested();
      item.markAsCooking();
      item.markAsReady();
      item.markAsDelivered();

      const primitives = item.toPrimitives();

      expect(primitives).toMatchObject({
        id: itemId.getValue(),
        orderId: orderId.getValue(),
        recipeId: 'RCP-001',
        recipeName: 'Burger Deluxe',
        status: OrderItemStatus.DELIVERED,
      });

      expect(primitives.assignedAt).toBeDefined();
      expect(primitives.preparedAt).toBeDefined();
      expect(primitives.deliveredAt).toBeDefined();
    });

    it('should serialize failed item to primitives', () => {
      const item = new OrderItem(itemId, orderId);
      item.markAsFailed('Kitchen error');

      const primitives = item.toPrimitives();

      expect(primitives).toMatchObject({
        status: OrderItemStatus.FAILED,
        failureReason: 'Kitchen error',
      });
    });
  });

  describe('fromPrimitives', () => {
    it('should deserialize pending item from primitives', () => {
      const primitives = {
        id: 'ITEM-1234567890-abc123',
        orderId: 'ORD-1234567890-XYZ789',
        status: OrderItemStatus.PENDING,
        createdAt: new Date().toISOString(),
      };

      const item = OrderItem.fromPrimitives(primitives);

      expect(item.getId().getValue()).toBe(primitives.id);
      expect(item.getOrderId().getValue()).toBe(primitives.orderId);
      expect(item.getStatus()).toBe(OrderItemStatus.PENDING);
    });

    it('should deserialize assigned item from primitives', () => {
      const primitives = {
        id: 'ITEM-1234567890-abc123',
        orderId: 'ORD-1234567890-XYZ789',
        recipeId: 'RCP-001',
        recipeName: 'Burger',
        status: OrderItemStatus.ASSIGNED,
        createdAt: new Date().toISOString(),
        assignedAt: new Date().toISOString(),
      };

      const item = OrderItem.fromPrimitives(primitives);

      expect(item.getRecipeId()).toBe('RCP-001');
      expect(item.getRecipeName()).toBe('Burger');
      expect(item.getAssignedAt()).toBeInstanceOf(Date);
    });

    it('should deserialize delivered item from primitives', () => {
      const primitives = {
        id: 'ITEM-1234567890-abc123',
        orderId: 'ORD-1234567890-XYZ789',
        recipeId: 'RCP-001',
        recipeName: 'Burger',
        status: OrderItemStatus.DELIVERED,
        createdAt: new Date().toISOString(),
        assignedAt: new Date().toISOString(),
        preparedAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
      };

      const item = OrderItem.fromPrimitives(primitives);

      expect(item.getStatus()).toBe(OrderItemStatus.DELIVERED);
      expect(item.getPreparedAt()).toBeInstanceOf(Date);
      expect(item.getDeliveredAt()).toBeInstanceOf(Date);
    });

    it('should deserialize failed item from primitives', () => {
      const primitives = {
        id: 'ITEM-1234567890-abc123',
        orderId: 'ORD-1234567890-XYZ789',
        status: OrderItemStatus.FAILED,
        createdAt: new Date().toISOString(),
        failureReason: 'Burnt',
      };

      const item = OrderItem.fromPrimitives(primitives);

      expect(item.getStatus()).toBe(OrderItemStatus.FAILED);
      expect(item.getFailureReason()).toBe('Burnt');
    });
  });
});
