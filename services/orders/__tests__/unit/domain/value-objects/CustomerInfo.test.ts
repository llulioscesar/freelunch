/**
 * Unit Tests: CustomerInfo Value Object
 */
import { CustomerInfo } from '../../../../src/domain/value-objects/CustomerInfo';

describe('CustomerInfo Value Object', () => {
  describe('constructor', () => {
    it('should create customer info with name', () => {
      const info = new CustomerInfo('John Doe');

      expect(info.getName()).toBe('John Doe');
      expect(info.getNotes()).toBeUndefined();
    });

    it('should create customer info with name and notes', () => {
      const info = new CustomerInfo('John Doe', 'No onions');

      expect(info.getName()).toBe('John Doe');
      expect(info.getNotes()).toBe('No onions');
    });

    it('should default to Anonymous when name is not provided', () => {
      const info = new CustomerInfo();

      expect(info.getName()).toBe('Anonymous');
      expect(info.isAnonymous()).toBe(true);
    });

    it('should throw error when name exceeds 100 characters', () => {
      const longName = 'a'.repeat(101);

      expect(() => new CustomerInfo(longName)).toThrow(
        'Customer name cannot exceed 100 characters'
      );
    });

    it('should allow name with exactly 100 characters', () => {
      const name = 'a'.repeat(100);

      expect(() => new CustomerInfo(name)).not.toThrow();
    });

    it('should throw error when notes exceed 500 characters', () => {
      const longNotes = 'a'.repeat(501);

      expect(() => new CustomerInfo('John', longNotes)).toThrow(
        'Notes cannot exceed 500 characters'
      );
    });

    it('should allow notes with exactly 500 characters', () => {
      const notes = 'a'.repeat(500);

      expect(() => new CustomerInfo('John', notes)).not.toThrow();
    });
  });

  describe('getName', () => {
    it('should return the customer name', () => {
      const info = new CustomerInfo('Jane Doe');

      expect(info.getName()).toBe('Jane Doe');
    });
  });

  describe('getNotes', () => {
    it('should return notes when provided', () => {
      const info = new CustomerInfo('John', 'Extra spicy');

      expect(info.getNotes()).toBe('Extra spicy');
    });

    it('should return undefined when notes are not provided', () => {
      const info = new CustomerInfo('John');

      expect(info.getNotes()).toBeUndefined();
    });
  });

  describe('isAnonymous', () => {
    it('should return true for anonymous customers', () => {
      const info = new CustomerInfo();

      expect(info.isAnonymous()).toBe(true);
    });

    it('should return false for named customers', () => {
      const info = new CustomerInfo('John');

      expect(info.isAnonymous()).toBe(false);
    });
  });

  describe('hasSpecialRequirements', () => {
    it('should return true when notes are provided', () => {
      const info = new CustomerInfo('John', 'No onions');

      expect(info.hasSpecialRequirements()).toBe(true);
    });

    it('should return false when notes are not provided', () => {
      const info = new CustomerInfo('John');

      expect(info.hasSpecialRequirements()).toBe(false);
    });

    it('should return false when notes are empty string', () => {
      const info = new CustomerInfo('John', '');

      expect(info.hasSpecialRequirements()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal customer info', () => {
      const info1 = new CustomerInfo('John', 'No onions');
      const info2 = new CustomerInfo('John', 'No onions');

      expect(info1.equals(info2)).toBe(true);
    });

    it('should return false for different names', () => {
      const info1 = new CustomerInfo('John', 'No onions');
      const info2 = new CustomerInfo('Jane', 'No onions');

      expect(info1.equals(info2)).toBe(false);
    });

    it('should return false for different notes', () => {
      const info1 = new CustomerInfo('John', 'No onions');
      const info2 = new CustomerInfo('John', 'Extra spicy');

      expect(info1.equals(info2)).toBe(false);
    });

    it('should return true for both anonymous without notes', () => {
      const info1 = new CustomerInfo();
      const info2 = new CustomerInfo();

      expect(info1.equals(info2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return name with notes in parentheses', () => {
      const info = new CustomerInfo('John', 'No onions');

      expect(info.toString()).toBe('John (No onions)');
    });

    it('should return just name when no notes', () => {
      const info = new CustomerInfo('John');

      expect(info.toString()).toBe('John');
    });

    it('should return Anonymous when no name provided', () => {
      const info = new CustomerInfo();

      expect(info.toString()).toBe('Anonymous');
    });
  });
});
