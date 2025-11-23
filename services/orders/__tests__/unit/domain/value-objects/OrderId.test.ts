/**
 * Unit Tests: OrderId value object
 */
import { OrderId } from '../../../../src/domain/value-objects/OrderId';

describe('OrderId', () => {
  describe('constructor', () => {
    it('should generate a valid OrderId when no value provided', () => {
      const orderId = new OrderId();
      const value = orderId.getValue();

      expect(value).toBeTruthy();
      expect(value).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('should accept a valid OrderId value', () => {
      const validId = 'ORD-1234567890-ABC123';
      const orderId = new OrderId(validId);

      expect(orderId.getValue()).toBe(validId);
    });

    it('should throw error for invalid OrderId format', () => {
      const invalidIds = [
        'invalid-id',
        'ORDER-123-ABC',
        'ord-123-abc',
        'NOTORD-123-ABC',
      ];

      invalidIds.forEach((invalidId) => {
        expect(() => new OrderId(invalidId)).toThrow('Invalid OrderId format');
      });
    });

    it('should generate new ID when empty string provided', () => {
      const orderId = new OrderId('');
      expect(orderId.getValue()).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
    });
  });

  describe('equals', () => {
    it('should return true for equal OrderIds', () => {
      const id = 'ORD-1234567890-ABC123';
      const orderId1 = new OrderId(id);
      const orderId2 = new OrderId(id);

      expect(orderId1.equals(orderId2)).toBe(true);
    });

    it('should return false for different OrderIds', () => {
      const orderId1 = new OrderId('ORD-1234567890-ABC123');
      const orderId2 = new OrderId('ORD-9876543210-XYZ789');

      expect(orderId1.equals(orderId2)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate unique OrderIds', () => {
      const orderId1 = new OrderId();
      const orderId2 = new OrderId();

      expect(orderId1.getValue()).not.toBe(orderId2.getValue());
    });

    it('should generate OrderIds with correct format', () => {
      const orderId = new OrderId();
      const value = orderId.getValue();

      expect(value).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
    });
  });

  describe('toString', () => {
    it('should return the OrderId value as string', () => {
      const value = 'ORD-TEST123-XYZ';
      const orderId = new OrderId(value);

      expect(orderId.toString()).toBe(value);
    });
  });

  describe('getValue', () => {
    it('should return the OrderId value', () => {
      const value = 'ORD-1234567890-ABC123';
      const orderId = new OrderId(value);

      expect(orderId.getValue()).toBe(value);
    });
  });
});
