import { Quantity } from '../../../../src/domain/value-objects/Quantity';

describe('Quantity', () => {
  describe('constructor', () => {
    it('should create quantity with valid value', () => {
      const quantity = new Quantity(5);
      expect(quantity.getValue()).toBe(5);
    });

    it('should create quantity with zero', () => {
      const quantity = new Quantity(0);
      expect(quantity.getValue()).toBe(0);
    });

    it('should throw error for negative value', () => {
      expect(() => new Quantity(-1)).toThrow('Quantity cannot be negative');
    });

    it('should throw error for non-integer value', () => {
      expect(() => new Quantity(1.5)).toThrow('Quantity must be an integer');
    });
  });

  describe('add', () => {
    it('should add two quantities', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(3);
      const result = q1.add(q2);
      expect(result.getValue()).toBe(8);
    });

    it('should return new instance', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(3);
      const result = q1.add(q2);
      expect(result).not.toBe(q1);
      expect(result).not.toBe(q2);
    });
  });

  describe('subtract', () => {
    it('should subtract two quantities', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(3);
      const result = q1.subtract(q2);
      expect(result.getValue()).toBe(2);
    });

    it('should throw error when result would be negative', () => {
      const q1 = new Quantity(3);
      const q2 = new Quantity(5);
      expect(() => q1.subtract(q2)).toThrow(
        'Cannot subtract: result would be negative'
      );
    });

    it('should allow subtracting to zero', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(5);
      const result = q1.subtract(q2);
      expect(result.getValue()).toBe(0);
    });
  });

  describe('comparisons', () => {
    it('isGreaterThanOrEqual should work correctly', () => {
      const q5 = new Quantity(5);
      const q3 = new Quantity(3);
      expect(q5.isGreaterThanOrEqual(q3)).toBe(true);
      expect(q5.isGreaterThanOrEqual(q5)).toBe(true);
      expect(q3.isGreaterThanOrEqual(q5)).toBe(false);
    });

    it('isGreaterThan should work correctly', () => {
      const q5 = new Quantity(5);
      const q3 = new Quantity(3);
      expect(q5.isGreaterThan(q3)).toBe(true);
      expect(q5.isGreaterThan(q5)).toBe(false);
    });

    it('isLessThan should work correctly', () => {
      const q5 = new Quantity(5);
      const q3 = new Quantity(3);
      expect(q3.isLessThan(q5)).toBe(true);
      expect(q5.isLessThan(q3)).toBe(false);
    });

    it('isZero should work correctly', () => {
      expect(new Quantity(0).isZero()).toBe(true);
      expect(new Quantity(5).isZero()).toBe(false);
    });

    it('equals should work correctly', () => {
      const q1 = new Quantity(5);
      const q2 = new Quantity(5);
      const q3 = new Quantity(3);
      expect(q1.equals(q2)).toBe(true);
      expect(q1.equals(q3)).toBe(false);
    });
  });

  describe('static methods', () => {
    it('zero should return quantity of 0', () => {
      const zero = Quantity.zero();
      expect(zero.getValue()).toBe(0);
    });

    it('fromNumber should floor decimal values', () => {
      const quantity = Quantity.fromNumber(5.9);
      expect(quantity.getValue()).toBe(5);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const quantity = new Quantity(5);
      expect(quantity.toString()).toBe('5');
    });
  });
});
