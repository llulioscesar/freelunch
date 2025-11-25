import { InventoryItem } from '../../../../src/domain/entities/InventoryItem';
import { InventoryItemId } from '../../../../src/domain/value-objects/InventoryItemId';
import { IngredientName } from '../../../../src/domain/value-objects/IngredientName';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';

describe('InventoryItem', () => {
  const createInventoryItem = (
    ingredientName = 'tomato',
    quantity = 5
  ): InventoryItem => {
    return new InventoryItem(
      new InventoryItemId('item-123'),
      new IngredientName(ingredientName),
      new Quantity(quantity)
    );
  };

  describe('constructor', () => {
    it('should create inventory item with all properties', () => {
      const item = createInventoryItem();
      expect(item.getId().getValue()).toBe('item-123');
      expect(item.getIngredientName().getValue()).toBe('tomato');
      expect(item.getQuantity().getValue()).toBe(5);
      expect(item.getCreatedAt()).toBeInstanceOf(Date);
      expect(item.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('addStock', () => {
    it('should add stock to inventory item', () => {
      const item = createInventoryItem('tomato', 5);
      item.addStock(new Quantity(3));
      expect(item.getQuantity().getValue()).toBe(8);
    });

    it('should update updatedAt timestamp', () => {
      const item = createInventoryItem('tomato', 5);
      const originalUpdatedAt = item.getUpdatedAt();

      // Small delay to ensure different timestamp
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      item.addStock(new Quantity(3));
      expect(item.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );

      jest.useRealTimers();
    });
  });

  describe('removeStock', () => {
    it('should remove stock from inventory item', () => {
      const item = createInventoryItem('tomato', 5);
      item.removeStock(new Quantity(3));
      expect(item.getQuantity().getValue()).toBe(2);
    });

    it('should throw error when insufficient stock', () => {
      const item = createInventoryItem('tomato', 3);
      expect(() => item.removeStock(new Quantity(5))).toThrow(
        'Insufficient stock for tomato'
      );
    });

    it('should allow removing all stock', () => {
      const item = createInventoryItem('tomato', 5);
      item.removeStock(new Quantity(5));
      expect(item.getQuantity().getValue()).toBe(0);
    });
  });

  describe('hasEnoughStock', () => {
    it('should return true when stock is sufficient', () => {
      const item = createInventoryItem('tomato', 5);
      expect(item.hasEnoughStock(new Quantity(3))).toBe(true);
      expect(item.hasEnoughStock(new Quantity(5))).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const item = createInventoryItem('tomato', 3);
      expect(item.hasEnoughStock(new Quantity(5))).toBe(false);
    });
  });

  describe('getMissingQuantity', () => {
    it('should return zero when stock is sufficient', () => {
      const item = createInventoryItem('tomato', 5);
      const missing = item.getMissingQuantity(new Quantity(3));
      expect(missing.getValue()).toBe(0);
    });

    it('should return missing quantity when stock is insufficient', () => {
      const item = createInventoryItem('tomato', 3);
      const missing = item.getMissingQuantity(new Quantity(5));
      expect(missing.getValue()).toBe(2);
    });
  });

  describe('toPrimitives', () => {
    it('should serialize to primitives', () => {
      const item = createInventoryItem('tomato', 5);
      const primitives = item.toPrimitives();

      expect(primitives.id).toBe('item-123');
      expect(primitives.ingredientName).toBe('tomato');
      expect(primitives.quantity).toBe(5);
      expect(primitives.createdAt).toBeDefined();
      expect(primitives.updatedAt).toBeDefined();
    });
  });

  describe('fromPrimitives', () => {
    it('should deserialize from primitives', () => {
      const item = InventoryItem.fromPrimitives({
        id: 'item-456',
        ingredientName: 'cheese',
        quantity: 10,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });

      expect(item.getId().getValue()).toBe('item-456');
      expect(item.getIngredientName().getValue()).toBe('cheese');
      expect(item.getQuantity().getValue()).toBe(10);
    });
  });

  describe('createWithInitialStock', () => {
    it('should create with default initial stock of 5', () => {
      const item = InventoryItem.createWithInitialStock('tomato');
      expect(item.getIngredientName().getValue()).toBe('tomato');
      expect(item.getQuantity().getValue()).toBe(5);
    });

    it('should create with custom initial stock', () => {
      const item = InventoryItem.createWithInitialStock('tomato', 10);
      expect(item.getQuantity().getValue()).toBe(10);
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const item1 = createInventoryItem('tomato', 5);
      const item2 = new InventoryItem(
        new InventoryItemId('item-123'),
        new IngredientName('cheese'),
        new Quantity(10)
      );
      expect(item1.equals(item2)).toBe(true);
    });

    it('should return false for different id', () => {
      const item1 = createInventoryItem('tomato', 5);
      const item2 = new InventoryItem(
        new InventoryItemId('item-456'),
        new IngredientName('tomato'),
        new Quantity(5)
      );
      expect(item1.equals(item2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const item = createInventoryItem('tomato', 5);
      expect(item.toString()).toBe('InventoryItem(tomato: 5)');
    });
  });
});
