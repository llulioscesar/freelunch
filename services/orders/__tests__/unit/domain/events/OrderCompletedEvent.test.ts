/**
 * Unit Tests: OrderCompletedEvent
 */
import { OrderCompletedEvent } from '../../../../src/domain/events/OrderCompletedEvent';

describe('OrderCompletedEvent', () => {
  it('should create event with all parameters', () => {
    const orderId = 'ORD-123-ABC';
    const completedAt = new Date();
    const preparationTimeMinutes = 15;
    const quantity = 5;

    const event = new OrderCompletedEvent(orderId, completedAt, preparationTimeMinutes, quantity);

    expect(event.aggregateId).toBe(orderId);
    expect(event.completedAt).toBe(completedAt);
    expect(event.preparationTimeMinutes).toBe(preparationTimeMinutes);
    expect(event.quantity).toBe(quantity);
    expect(event.eventName()).toBe('order.completed');
  });

  it('should serialize to primitives with all fields', () => {
    const orderId = 'ORD-123-ABC';
    const completedAt = new Date('2024-01-01T12:00:00Z');
    const preparationTimeMinutes = 15;
    const quantity = 5;

    const event = new OrderCompletedEvent(orderId, completedAt, preparationTimeMinutes, quantity);
    const primitives = event.toPrimitives();

    expect(primitives.event).toBe('ORDER_COMPLETED');
    expect(primitives.orderId).toBe(orderId);
    expect(primitives.completedAt).toBe(completedAt.toISOString());
    expect(primitives.preparationTimeMinutes).toBe(preparationTimeMinutes);
    expect(primitives.quantity).toBe(quantity);
    expect(primitives.timestamp).toBe(event.occurredOn.toISOString());
  });

  it('should have occurredOn timestamp', () => {
    const orderId = 'ORD-123-ABC';
    const completedAt = new Date();
    const event = new OrderCompletedEvent(orderId, completedAt, 15, 5);

    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
