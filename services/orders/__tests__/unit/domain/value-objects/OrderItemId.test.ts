/**
 * Unit Tests: OrderItemId Value Object
 */
import { OrderItemId } from '../../../../src/domain/value-objects/OrderItemId';

describe('OrderItemId Value Object', () => {
  describe('constructor', () => {
    it('should generate a valid ID when no value provided', () => {
      const id = new OrderItemId();

      expect(id.getValue()).toMatch(/^ITEM-\d+-[a-z0-9]+$/);
    });

    it('should accept a valid OrderItemId format', () => {
      const validId = 'ITEM-1234567890-abc123';
      const id = new OrderItemId(validId);

      expect(id.getValue()).toBe(validId);
    });

    it('should throw error for invalid format', () => {
      expect(() => new OrderItemId('invalid-id')).toThrow('Invalid OrderItemId format');
      expect(() => new OrderItemId('ITEM-abc-123')).toThrow('Invalid OrderItemId format');
      expect(() => new OrderItemId('ORDER-123-abc')).toThrow('Invalid OrderItemId format');
    });

    it('should generate unique IDs', () => {
      const id1 = new OrderItemId();
      const id2 = new OrderItemId();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });

    it('should accept ID with various random parts', () => {
      const id1 = new OrderItemId('ITEM-1234567890-a1b2c3');
      const id2 = new OrderItemId('ITEM-9999999999-xyz789');

      expect(id1.getValue()).toMatch(/^ITEM-\d+-[a-z0-9]+$/);
      expect(id2.getValue()).toMatch(/^ITEM-\d+-[a-z0-9]+$/);
    });
  });

  describe('getValue', () => {
    it('should return the item ID value', () => {
      const itemId = new OrderItemId('ITEM-1234567890-abc123');

      expect(itemId.getValue()).toBe('ITEM-1234567890-abc123');
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const itemId = new OrderItemId('ITEM-1234567890-abc123');

      expect(itemId.toString()).toBe('ITEM-1234567890-abc123');
    });

    it('should match getValue output', () => {
      const itemId = new OrderItemId();

      expect(itemId.toString()).toBe(itemId.getValue());
    });
  });

  describe('equals', () => {
    it('should return true for equal OrderItemIds', () => {
      const id1 = new OrderItemId('ITEM-1234567890-abc123');
      const id2 = new OrderItemId('ITEM-1234567890-abc123');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different OrderItemIds', () => {
      const id1 = new OrderItemId('ITEM-1234567890-abc123');
      const id2 = new OrderItemId('ITEM-9999999999-xyz789');

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('ID generation', () => {
    it('should include timestamp in generated ID', () => {
      const beforeTimestamp = Date.now();
      const id = new OrderItemId();
      const afterTimestamp = Date.now();

      const idValue = id.getValue();
      const timestampPart = parseInt(idValue.split('-')[1]);

      expect(timestampPart).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestampPart).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should include random part in generated ID', () => {
      const id = new OrderItemId();
      const parts = id.getValue().split('-');

      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });
});
