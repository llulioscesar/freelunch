import { PlateCookingStartedEvent } from '../../../../src/domain/events/PlateCookingStartedEvent';

describe('PlateCookingStartedEvent', () => {
  it('should create event with correct properties', () => {
    const cookingStartedAt = new Date('2025-01-01T10:00:00Z');

    const event = new PlateCookingStartedEvent(
      'plate-123',
      'order-456',
      'item-789',
      'recipe-abc',
      'Tomato Salad',
      cookingStartedAt
    );

    expect(event.plateId).toBe('plate-123');
    expect(event.orderId).toBe('order-456');
    expect(event.orderItemId).toBe('item-789');
    expect(event.recipeId).toBe('recipe-abc');
    expect(event.recipeName).toBe('Tomato Salad');
    expect(event.cookingStartedAt).toBe(cookingStartedAt);
  });

  it('should return correct event name', () => {
    const event = new PlateCookingStartedEvent(
      'plate-123',
      'order-456',
      'item-789',
      'recipe-abc',
      'Tomato Salad',
      new Date()
    );

    expect(event.eventName).toBe('kitchen.plate.cooking');
  });

  it('should convert to primitives correctly', () => {
    const cookingStartedAt = new Date('2025-01-01T10:00:00Z');

    const event = new PlateCookingStartedEvent(
      'plate-123',
      'order-456',
      'item-789',
      'recipe-abc',
      'Tomato Salad',
      cookingStartedAt
    );

    const primitives = event.toPrimitives();

    expect(primitives).toEqual({
      plateId: 'plate-123',
      orderId: 'order-456',
      orderItemId: 'item-789',
      recipeId: 'recipe-abc',
      recipeName: 'Tomato Salad',
      cookingStartedAt: '2025-01-01T10:00:00.000Z',
    });
  });

  it('should have eventId and occurredOn from base class', () => {
    const event = new PlateCookingStartedEvent(
      'plate-123',
      'order-456',
      'item-789',
      'recipe-abc',
      'Tomato Salad',
      new Date()
    );

    expect(event.eventId).toBeDefined();
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
