/**
 * Unit Tests: PlateId Value Object
 */
import { PlateId } from '../../../../src/domain/value-objects/PlateId';

describe('PlateId Value Object', () => {
  describe('Constructor', () => {
    it('should create a new PlateId with auto-generated UUID', () => {
      const plateId = new PlateId();

      expect(plateId.getValue()).toBeTruthy();
      expect(plateId.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create PlateId with provided value', () => {
      const id = 'plate-123';
      const plateId = new PlateId(id);

      expect(plateId.getValue()).toBe(id);
    });

    it('should throw error for empty id', () => {
      expect(() => new PlateId(''))
        .toThrow('PlateId cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new PlateId('   '))
        .toThrow('PlateId cannot be empty');
    });
  });

  describe('equals', () => {
    it('should be equal to another PlateId with same value', () => {
      const id = 'plate-123';
      const plateId1 = new PlateId(id);
      const plateId2 = new PlateId(id);

      expect(plateId1.equals(plateId2)).toBe(true);
    });

    it('should NOT be equal to another PlateId with different value', () => {
      const plateId1 = new PlateId('plate-123');
      const plateId2 = new PlateId('plate-456');

      expect(plateId1.equals(plateId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const id = 'plate-789';
      const plateId = new PlateId(id);

      expect(plateId.toString()).toBe(id);
    });
  });
});
