/**
 * Unit Tests: OrderReference Value Object
 */
import { OrderReference } from '../../../../src/domain/value-objects/OrderReference';

describe('OrderReference Value Object', () => {
  describe('Constructor', () => {
    it('should create OrderReference with valid values', () => {
      const orderRef = new OrderReference('order-123', 'item-456');

      expect(orderRef.getOrderId()).toBe('order-123');
      expect(orderRef.getOrderItemId()).toBe('item-456');
    });

    it('should throw error for empty orderId', () => {
      expect(() => new OrderReference('', 'item-456'))
        .toThrow('orderId cannot be empty');
    });

    it('should throw error for whitespace-only orderId', () => {
      expect(() => new OrderReference('   ', 'item-456'))
        .toThrow('orderId cannot be empty');
    });

    it('should throw error for empty orderItemId', () => {
      expect(() => new OrderReference('order-123', ''))
        .toThrow('orderItemId cannot be empty');
    });

    it('should throw error for whitespace-only orderItemId', () => {
      expect(() => new OrderReference('order-123', '   '))
        .toThrow('orderItemId cannot be empty');
    });
  });

  describe('Getters', () => {
    it('should return correct orderId', () => {
      const orderRef = new OrderReference('order-789', 'item-101');

      expect(orderRef.getOrderId()).toBe('order-789');
    });

    it('should return correct orderItemId', () => {
      const orderRef = new OrderReference('order-789', 'item-101');

      expect(orderRef.getOrderItemId()).toBe('item-101');
    });
  });

  describe('equals', () => {
    it('should be equal to another OrderReference with same values', () => {
      const orderRef1 = new OrderReference('order-123', 'item-456');
      const orderRef2 = new OrderReference('order-123', 'item-456');

      expect(orderRef1.equals(orderRef2)).toBe(true);
    });

    it('should NOT be equal with different orderId', () => {
      const orderRef1 = new OrderReference('order-123', 'item-456');
      const orderRef2 = new OrderReference('order-789', 'item-456');

      expect(orderRef1.equals(orderRef2)).toBe(false);
    });

    it('should NOT be equal with different orderItemId', () => {
      const orderRef1 = new OrderReference('order-123', 'item-456');
      const orderRef2 = new OrderReference('order-123', 'item-789');

      expect(orderRef1.equals(orderRef2)).toBe(false);
    });
  });

  describe('toPrimitives', () => {
    it('should return plain object', () => {
      const orderRef = new OrderReference('order-123', 'item-456');

      const primitives = orderRef.toPrimitives();

      expect(primitives).toEqual({
        orderId: 'order-123',
        orderItemId: 'item-456',
      });
    });
  });
});
