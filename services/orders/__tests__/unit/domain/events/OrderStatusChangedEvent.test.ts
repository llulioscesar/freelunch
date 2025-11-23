/**
 * Unit Tests: OrderStatusChangedEvent
 */
import { OrderStatusChangedEvent } from '../../../../src/domain/events/OrderStatusChangedEvent';
import { OrderStatusEnum } from '../../../../src/domain/value-objects/OrderStatus';

describe('OrderStatusChangedEvent', () => {
  it('should create event with all parameters', () => {
    const orderId = 'ORD-123-ABC';
    const previousStatus = OrderStatusEnum.PENDING;
    const newStatus = OrderStatusEnum.PREPARING;

    const event = new OrderStatusChangedEvent(orderId, previousStatus, newStatus);

    expect(event.aggregateId).toBe(orderId);
    expect(event.previousStatus).toBe(previousStatus);
    expect(event.newStatus).toBe(newStatus);
    expect(event.eventName()).toBe('order.status.changed');
  });

  it('should serialize to primitives', () => {
    const orderId = 'ORD-123-ABC';
    const previousStatus = OrderStatusEnum.PENDING;
    const newStatus = OrderStatusEnum.PREPARING;

    const event = new OrderStatusChangedEvent(orderId, previousStatus, newStatus);
    const primitives = event.toPrimitives();

    expect(primitives.event).toBe('ORDER_STATUS_CHANGED');
    expect(primitives.orderId).toBe(orderId);
    expect(primitives.previousStatus).toBe(previousStatus);
    expect(primitives.newStatus).toBe(newStatus);
    expect(primitives.timestamp).toBe(event.occurredOn.toISOString());
  });

  it('should handle different status transitions', () => {
    const transitions = [
      { from: OrderStatusEnum.PENDING, to: OrderStatusEnum.PREPARING },
      { from: OrderStatusEnum.PREPARING, to: OrderStatusEnum.READY },
      { from: OrderStatusEnum.READY, to: OrderStatusEnum.DELIVERED },
    ];

    transitions.forEach(({ from, to }) => {
      const event = new OrderStatusChangedEvent('ORD-123', from, to);
      const primitives = event.toPrimitives();

      expect(primitives.newStatus).toBe(to);
      expect(primitives.previousStatus).toBe(from);
    });
  });

  it('should handle failed status transition', () => {
    const event = new OrderStatusChangedEvent(
      'ORD-123',
      OrderStatusEnum.PREPARING,
      OrderStatusEnum.FAILED
    );

    const primitives = event.toPrimitives();

    expect(primitives.newStatus).toBe(OrderStatusEnum.FAILED);
    expect(primitives.previousStatus).toBe(OrderStatusEnum.PREPARING);
  });

  it('should have occurredOn timestamp', () => {
    const event = new OrderStatusChangedEvent(
      'ORD-123',
      OrderStatusEnum.PENDING,
      OrderStatusEnum.PREPARING
    );

    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
