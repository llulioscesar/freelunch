/**
 * Unit Tests: OrderFailedEvent
 */
import { OrderFailedEvent } from '../../../../src/domain/events/OrderFailedEvent';

describe('OrderFailedEvent', () => {
  it('should create event with reason', () => {
    const orderId = 'ORD-123-ABC';
    const failedAt = new Date();
    const reason = 'Kitchen error';
    const quantity = 2;

    const event = new OrderFailedEvent(orderId, failedAt, reason, quantity);

    expect(event.aggregateId).toBe(orderId);
    expect(event.failedAt).toBe(failedAt);
    expect(event.reason).toBe(reason);
    expect(event.quantity).toBe(quantity);
    expect(event.eventName()).toBe('order.failed');
  });

  it('should create event with error details', () => {
    const orderId = 'ORD-123-ABC';
    const failedAt = new Date();
    const reason = 'Kitchen error';
    const quantity = 2;
    const errorDetails = 'Detailed error information';

    const event = new OrderFailedEvent(orderId, failedAt, reason, quantity, errorDetails);

    expect(event.aggregateId).toBe(orderId);
    expect(event.errorDetails).toBe(errorDetails);
    expect(event.eventName()).toBe('order.failed');
  });

  it('should create event without error details', () => {
    const orderId = 'ORD-123-ABC';
    const failedAt = new Date();
    const reason = 'Kitchen error';
    const quantity = 2;

    const event = new OrderFailedEvent(orderId, failedAt, reason, quantity);

    expect(event.aggregateId).toBe(orderId);
    expect(event.errorDetails).toBeUndefined();
  });

  it('should serialize to primitives with all fields', () => {
    const orderId = 'ORD-123-ABC';
    const failedAt = new Date('2024-01-01T12:00:00Z');
    const reason = 'Kitchen error';
    const quantity = 2;
    const errorDetails = 'Detailed error';

    const event = new OrderFailedEvent(orderId, failedAt, reason, quantity, errorDetails);
    const primitives = event.toPrimitives();

    expect(primitives.event).toBe('ORDER_FAILED');
    expect(primitives.orderId).toBe(orderId);
    expect(primitives.failedAt).toBe(failedAt.toISOString());
    expect(primitives.reason).toBe(reason);
    expect(primitives.errorDetails).toBe(errorDetails);
    expect(primitives.quantity).toBe(quantity);
    expect(primitives.timestamp).toBe(event.occurredOn.toISOString());
  });

  it('should serialize to primitives without error details', () => {
    const orderId = 'ORD-123-ABC';
    const failedAt = new Date('2024-01-01T12:00:00Z');
    const reason = 'Kitchen error';
    const quantity = 2;

    const event = new OrderFailedEvent(orderId, failedAt, reason, quantity);
    const primitives = event.toPrimitives();

    expect(primitives.orderId).toBe(orderId);
    expect(primitives.reason).toBe(reason);
    expect(primitives.errorDetails).toBeUndefined();
    expect(primitives.quantity).toBe(quantity);
  });
});
