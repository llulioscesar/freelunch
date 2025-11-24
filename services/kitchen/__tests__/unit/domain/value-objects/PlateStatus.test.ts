/**
 * Unit Tests: PlateStatus Value Object
 */
import { PlateStatus, PlateStatusEnum } from '../../../../src/domain/value-objects/PlateStatus';

describe('PlateStatus Value Object', () => {
  describe('Constructor', () => {
    it('should create a valid PlateStatus', () => {
      const status = new PlateStatus(PlateStatusEnum.PENDING);

      expect(status.getValue()).toBe(PlateStatusEnum.PENDING);
    });

    it('should throw error for invalid status', () => {
      expect(() => new PlateStatus('INVALID' as PlateStatusEnum))
        .toThrow('Invalid plate status');
    });
  });

  describe('State Checks', () => {
    it('should correctly identify PENDING status', () => {
      const status = new PlateStatus(PlateStatusEnum.PENDING);

      expect(status.isPending()).toBe(true);
      expect(status.isAssigned()).toBe(false);
      expect(status.isReady()).toBe(false);
      expect(status.isFailed()).toBe(false);
    });

    it('should correctly identify ASSIGNED status', () => {
      const status = new PlateStatus(PlateStatusEnum.ASSIGNED);

      expect(status.isPending()).toBe(false);
      expect(status.isAssigned()).toBe(true);
      expect(status.isReady()).toBe(false);
      expect(status.isFailed()).toBe(false);
    });

    it('should correctly identify READY status', () => {
      const status = new PlateStatus(PlateStatusEnum.READY);

      expect(status.isPending()).toBe(false);
      expect(status.isAssigned()).toBe(false);
      expect(status.isReady()).toBe(true);
      expect(status.isFailed()).toBe(false);
    });

    it('should correctly identify FAILED status', () => {
      const status = new PlateStatus(PlateStatusEnum.FAILED);

      expect(status.isPending()).toBe(false);
      expect(status.isAssigned()).toBe(false);
      expect(status.isReady()).toBe(false);
      expect(status.isFailed()).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow PENDING -> ASSIGNED transition', () => {
      const status = new PlateStatus(PlateStatusEnum.PENDING);

      expect(status.canTransitionTo(PlateStatusEnum.ASSIGNED)).toBe(true);
    });

    it('should allow PENDING -> FAILED transition', () => {
      const status = new PlateStatus(PlateStatusEnum.PENDING);

      expect(status.canTransitionTo(PlateStatusEnum.FAILED)).toBe(true);
    });

    it('should NOT allow PENDING -> READY transition', () => {
      const status = new PlateStatus(PlateStatusEnum.PENDING);

      expect(status.canTransitionTo(PlateStatusEnum.READY)).toBe(false);
    });

    it('should allow ASSIGNED -> REQUESTING_INGREDIENTS transition', () => {
      const status = new PlateStatus(PlateStatusEnum.ASSIGNED);

      expect(status.canTransitionTo(PlateStatusEnum.REQUESTING_INGREDIENTS)).toBe(true);
    });

    it('should allow COOKING -> READY transition', () => {
      const status = new PlateStatus(PlateStatusEnum.COOKING);

      expect(status.canTransitionTo(PlateStatusEnum.READY)).toBe(true);
    });

    it('should NOT allow READY -> PENDING transition', () => {
      const status = new PlateStatus(PlateStatusEnum.READY);

      expect(status.canTransitionTo(PlateStatusEnum.PENDING)).toBe(false);
    });

    it('should NOT allow transitions from FAILED', () => {
      const status = new PlateStatus(PlateStatusEnum.FAILED);

      expect(status.canTransitionTo(PlateStatusEnum.PENDING)).toBe(false);
      expect(status.canTransitionTo(PlateStatusEnum.READY)).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should be equal to another PlateStatus with same value', () => {
      const status1 = new PlateStatus(PlateStatusEnum.PENDING);
      const status2 = new PlateStatus(PlateStatusEnum.PENDING);

      expect(status1.equals(status2)).toBe(true);
    });

    it('should NOT be equal to another PlateStatus with different value', () => {
      const status1 = new PlateStatus(PlateStatusEnum.PENDING);
      const status2 = new PlateStatus(PlateStatusEnum.READY);

      expect(status1.equals(status2)).toBe(false);
    });
  });
});
