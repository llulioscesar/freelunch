/**
 * Unit Tests: OrderStatus Value Object
 */
import { OrderStatus, OrderStatusEnum } from '../../../../src/domain/value-objects/OrderStatus';

describe('OrderStatus Value Object', () => {
  describe('constructor', () => {
    it('should create a valid status', () => {
      const status = new OrderStatus(OrderStatusEnum.PENDING);

      expect(status.getValue()).toBe(OrderStatusEnum.PENDING);
    });

    it('should accept all valid status values', () => {
      const validStatuses = [
        OrderStatusEnum.PENDING,
        OrderStatusEnum.PREPARING,
        OrderStatusEnum.READY,
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.FAILED,
        OrderStatusEnum.CANCELLED,
      ];

      validStatuses.forEach(statusValue => {
        const status = new OrderStatus(statusValue);
        expect(status.getValue()).toBe(statusValue);
      });
    });

    it('should throw error for invalid status', () => {
      expect(() => new OrderStatus('INVALID_STATUS' as any)).toThrow('Invalid order status');
    });
  });

  describe('getValue', () => {
    it('should return the status value', () => {
      const status = new OrderStatus(OrderStatusEnum.PREPARING);

      expect(status.getValue()).toBe(OrderStatusEnum.PREPARING);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const status = new OrderStatus(OrderStatusEnum.READY);

      expect(status.toString()).toBe('READY');
    });
  });

  describe('canTransitionTo', () => {
    it('should allow transition from PENDING to PREPARING', () => {
      const status = new OrderStatus(OrderStatusEnum.PENDING);

      expect(status.canTransitionTo(OrderStatusEnum.PREPARING)).toBe(true);
    });

    it('should allow transition from PREPARING to INGREDIENTS_REQUESTED', () => {
      const status = new OrderStatus(OrderStatusEnum.PREPARING);

      expect(status.canTransitionTo(OrderStatusEnum.INGREDIENTS_REQUESTED)).toBe(true);
    });

    it('should allow transition from READY to DELIVERED', () => {
      const status = new OrderStatus(OrderStatusEnum.READY);

      expect(status.canTransitionTo(OrderStatusEnum.DELIVERED)).toBe(true);
    });

    it('should not allow backward transitions', () => {
      const status = new OrderStatus(OrderStatusEnum.READY);

      expect(status.canTransitionTo(OrderStatusEnum.PREPARING)).toBe(false);
      expect(status.canTransitionTo(OrderStatusEnum.PENDING)).toBe(false);
    });

    it('should not allow transition from final states', () => {
      const deliveredStatus = new OrderStatus(OrderStatusEnum.DELIVERED);
      expect(deliveredStatus.canTransitionTo(OrderStatusEnum.READY)).toBe(false);

      const failedStatus = new OrderStatus(OrderStatusEnum.FAILED);
      expect(failedStatus.canTransitionTo(OrderStatusEnum.READY)).toBe(false);

      const cancelledStatus = new OrderStatus(OrderStatusEnum.CANCELLED);
      expect(cancelledStatus.canTransitionTo(OrderStatusEnum.PREPARING)).toBe(false);
    });

    it('should allow transition to FAILED from valid states', () => {
      expect(new OrderStatus(OrderStatusEnum.PREPARING).canTransitionTo(OrderStatusEnum.FAILED)).toBe(true);
      expect(new OrderStatus(OrderStatusEnum.INGREDIENTS_REQUESTED).canTransitionTo(OrderStatusEnum.FAILED)).toBe(true);
      expect(new OrderStatus(OrderStatusEnum.COOKING).canTransitionTo(OrderStatusEnum.FAILED)).toBe(true);
    });

    it('should allow transition to CANCELLED from PENDING', () => {
      const status = new OrderStatus(OrderStatusEnum.PENDING);

      expect(status.canTransitionTo(OrderStatusEnum.CANCELLED)).toBe(true);
    });
  });

  describe('isPending', () => {
    it('should return true for PENDING status', () => {
      const status = new OrderStatus(OrderStatusEnum.PENDING);

      expect(status.isPending()).toBe(true);
    });

    it('should return false for non-PENDING statuses', () => {
      expect(new OrderStatus(OrderStatusEnum.PREPARING).isPending()).toBe(false);
      expect(new OrderStatus(OrderStatusEnum.DELIVERED).isPending()).toBe(false);
    });
  });

  describe('isFinal', () => {
    it('should return true for final statuses', () => {
      expect(new OrderStatus(OrderStatusEnum.DELIVERED).isFinal()).toBe(true);
      expect(new OrderStatus(OrderStatusEnum.FAILED).isFinal()).toBe(true);
      expect(new OrderStatus(OrderStatusEnum.CANCELLED).isFinal()).toBe(true);
    });

    it('should return false for non-final statuses', () => {
      expect(new OrderStatus(OrderStatusEnum.PENDING).isFinal()).toBe(false);
      expect(new OrderStatus(OrderStatusEnum.PREPARING).isFinal()).toBe(false);
      expect(new OrderStatus(OrderStatusEnum.READY).isFinal()).toBe(false);
    });
  });
});
