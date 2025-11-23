/**
 * Unit Tests: Quantity Value Object
 */
import { Quantity } from '../../../../src/domain/value-objects/Quantity';

describe('Quantity Value Object', () => {
  describe('constructor', () => {
    it('should create a valid quantity', () => {
      const quantity = new Quantity(5);

      expect(quantity.getValue()).toBe(5);
    });

    it('should accept minimum value of 1', () => {
      const quantity = new Quantity(1);

      expect(quantity.getValue()).toBe(1);
    });

    it('should accept maximum value of 100', () => {
      const quantity = new Quantity(100);

      expect(quantity.getValue()).toBe(100);
    });

    it('should throw error for quantity less than 1', () => {
      expect(() => new Quantity(0)).toThrow('Quantity must be at least 1');
      expect(() => new Quantity(-1)).toThrow('Quantity must be at least 1');
    });

    it('should throw error for quantity greater than 100', () => {
      expect(() => new Quantity(101)).toThrow('Quantity cannot exceed 100');
      expect(() => new Quantity(200)).toThrow('Quantity cannot exceed 100');
    });

    it('should throw error for non-integer values', () => {
      expect(() => new Quantity(1.5)).toThrow('Quantity must be an integer');
      expect(() => new Quantity(5.99)).toThrow('Quantity must be an integer');
    });
  });

  describe('getValue', () => {
    it('should return the quantity value', () => {
      const quantity = new Quantity(10);

      expect(quantity.getValue()).toBe(10);
    });
  });

  describe('calculateEstimatedPreparationTime', () => {
    it('should calculate preparation time correctly', () => {
      const quantity = new Quantity(5);
      const prepTime = quantity.calculateEstimatedPreparationTime();

      // baseTime (5) + (quantity * perItemTime (2))
      expect(prepTime).toBe(5 + 5 * 2); // 15 minutes
    });

    it('should calculate for different quantities', () => {
      expect(new Quantity(1).calculateEstimatedPreparationTime()).toBe(5 + 1 * 2); // 7
      expect(new Quantity(10).calculateEstimatedPreparationTime()).toBe(5 + 10 * 2); // 25
      expect(new Quantity(50).calculateEstimatedPreparationTime()).toBe(5 + 50 * 2); // 105
      expect(new Quantity(100).calculateEstimatedPreparationTime()).toBe(5 + 100 * 2); // 205
    });
  });

  describe('requiresBulkProcessing', () => {
    it('should return false for small quantities (<=10)', () => {
      expect(new Quantity(1).requiresBulkProcessing()).toBe(false);
      expect(new Quantity(10).requiresBulkProcessing()).toBe(false);
    });

    it('should return true for large quantities (>10)', () => {
      expect(new Quantity(11).requiresBulkProcessing()).toBe(true);
      expect(new Quantity(50).requiresBulkProcessing()).toBe(true);
      expect(new Quantity(100).requiresBulkProcessing()).toBe(true);
    });
  });

  describe('add', () => {
    it('should add two quantities', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(3);

      const result = q1.add(q2);

      expect(result.getValue()).toBe(8);
    });

    it('should throw when sum exceeds maximum', () => {
      const q1 = new Quantity(60);
      const q2 = new Quantity(50);

      expect(() => q1.add(q2)).toThrow('Quantity cannot exceed 100');
    });
  });

  describe('subtract', () => {
    it('should subtract two quantities', () => {
      const q1 = new Quantity(10);
      const q2 = new Quantity(3);

      const result = q1.subtract(q2);

      expect(result.getValue()).toBe(7);
    });

    it('should throw when result is less than minimum', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(10);

      expect(() => q1.subtract(q2)).toThrow('Quantity must be at least 1');
    });
  });

  describe('multiply', () => {
    it('should multiply quantity by factor', () => {
      const q = new Quantity(5);

      const result = q.multiply(3);

      expect(result.getValue()).toBe(15);
    });

    it('should floor decimal results', () => {
      const q = new Quantity(5);

      const result = q.multiply(1.5);

      expect(result.getValue()).toBe(7);
    });

    it('should throw when result exceeds maximum', () => {
      const q = new Quantity(50);

      expect(() => q.multiply(3)).toThrow('Quantity cannot exceed 100');
    });
  });

  describe('equals', () => {
    it('should return true for equal quantities', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(5);

      expect(q1.equals(q2)).toBe(true);
    });

    it('should return false for different quantities', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(10);

      expect(q1.equals(q2)).toBe(false);
    });
  });

  describe('isGreaterThan', () => {
    it('should return true when greater', () => {
      const q1 = new Quantity(10);
      const q2 = new Quantity(5);

      expect(q1.isGreaterThan(q2)).toBe(true);
    });

    it('should return false when equal or less', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(10);

      expect(q1.isGreaterThan(q2)).toBe(false);
      expect(q1.isGreaterThan(new Quantity(5))).toBe(false);
    });
  });

  describe('isLessThan', () => {
    it('should return true when less', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(10);

      expect(q1.isLessThan(q2)).toBe(true);
    });

    it('should return false when equal or greater', () => {
      const q1 = new Quantity(10);
      const q2 = new Quantity(5);

      expect(q1.isLessThan(q2)).toBe(false);
      expect(q1.isLessThan(new Quantity(10))).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const q = new Quantity(42);

      expect(q.toString()).toBe('42');
    });
  });
});
