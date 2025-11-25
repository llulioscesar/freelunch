import { IngredientsReservedEvent } from '../../../../src/domain/events/IngredientsReservedEvent';
import { IngredientsUnavailableEvent } from '../../../../src/domain/events/IngredientsUnavailableEvent';
import { PurchaseCompletedEvent } from '../../../../src/domain/events/PurchaseCompletedEvent';

describe('Domain Events', () => {
  describe('IngredientsReservedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new IngredientsReservedEvent(
        'plate-123',
        'item-456',
        { tomato: 2, cheese: 1 }
      );

      expect(event.plateId).toBe('plate-123');
      expect(event.orderItemId).toBe('item-456');
      expect(event.ingredients).toEqual({ tomato: 2, cheese: 1 });
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should return correct event name', () => {
      const event = new IngredientsReservedEvent(
        'plate-123',
        'item-456',
        { tomato: 2 }
      );

      expect(event.eventName).toBe('warehouse.ingredients.reserved');
    });

    it('should serialize to primitives', () => {
      const reservedAt = new Date('2024-01-01T00:00:00.000Z');
      const event = new IngredientsReservedEvent(
        'plate-123',
        'item-456',
        { tomato: 2 },
        reservedAt
      );

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        ingredients: { tomato: 2 },
        reservedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should serialize to JSON', () => {
      const event = new IngredientsReservedEvent(
        'plate-123',
        'item-456',
        { tomato: 2 }
      );

      const json = event.toJSON();

      expect(json.eventId).toBe(event.eventId);
      expect(json.eventName).toBe('warehouse.ingredients.reserved');
      expect(json.occurredAt).toBeDefined();
      expect(json.data).toBeDefined();
    });
  });

  describe('IngredientsUnavailableEvent', () => {
    it('should create event with correct properties', () => {
      const event = new IngredientsUnavailableEvent(
        'plate-123',
        'item-456',
        { tomato: 5, cheese: 3 },
        ['tomato', 'cheese'],
        'Market unavailable'
      );

      expect(event.plateId).toBe('plate-123');
      expect(event.orderItemId).toBe('item-456');
      expect(event.requestedIngredients).toEqual({ tomato: 5, cheese: 3 });
      expect(event.unavailableIngredients).toEqual(['tomato', 'cheese']);
      expect(event.reason).toBe('Market unavailable');
    });

    it('should return correct event name', () => {
      const event = new IngredientsUnavailableEvent(
        'plate-123',
        'item-456',
        { tomato: 2 },
        ['tomato'],
        'Out of stock'
      );

      expect(event.eventName).toBe('warehouse.ingredients.unavailable');
    });

    it('should serialize to primitives', () => {
      const event = new IngredientsUnavailableEvent(
        'plate-123',
        'item-456',
        { tomato: 5 },
        ['tomato'],
        'Market closed'
      );

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        plateId: 'plate-123',
        orderItemId: 'item-456',
        requestedIngredients: { tomato: 5 },
        unavailableIngredients: ['tomato'],
        reason: 'Market closed',
      });
    });
  });

  describe('PurchaseCompletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new PurchaseCompletedEvent(
        'purchase-123',
        'tomato',
        5,
        3,
        true,
        'plate-456',
        'order-789'
      );

      expect(event.purchaseId).toBe('purchase-123');
      expect(event.ingredientName).toBe('tomato');
      expect(event.requestedQuantity).toBe(5);
      expect(event.obtainedQuantity).toBe(3);
      expect(event.success).toBe(true);
      expect(event.plateId).toBe('plate-456');
      expect(event.orderId).toBe('order-789');
    });

    it('should create event without optional properties', () => {
      const event = new PurchaseCompletedEvent(
        'purchase-123',
        'tomato',
        5,
        3,
        true
      );

      expect(event.plateId).toBeUndefined();
      expect(event.orderId).toBeUndefined();
    });

    it('should return correct event name', () => {
      const event = new PurchaseCompletedEvent(
        'purchase-123',
        'tomato',
        5,
        3,
        true
      );

      expect(event.eventName).toBe('warehouse.purchase.completed');
    });

    it('should serialize to primitives', () => {
      const event = new PurchaseCompletedEvent(
        'purchase-123',
        'tomato',
        5,
        3,
        true,
        'plate-456',
        'order-789'
      );

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        purchaseId: 'purchase-123',
        ingredientName: 'tomato',
        requestedQuantity: 5,
        obtainedQuantity: 3,
        success: true,
        plateId: 'plate-456',
        orderId: 'order-789',
      });
    });

    it('should handle failed purchase', () => {
      const event = new PurchaseCompletedEvent(
        'purchase-123',
        'tomato',
        5,
        0,
        false
      );

      expect(event.success).toBe(false);
      expect(event.obtainedQuantity).toBe(0);
    });
  });
});
