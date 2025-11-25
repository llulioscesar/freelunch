import { Purchase } from '../../../../src/domain/entities/Purchase';
import { PurchaseId } from '../../../../src/domain/value-objects/PurchaseId';
import { IngredientName } from '../../../../src/domain/value-objects/IngredientName';
import { Quantity } from '../../../../src/domain/value-objects/Quantity';

describe('Purchase', () => {
  const createPurchase = (
    ingredientName = 'tomato',
    requestedQuantity = 3
  ): Purchase => {
    return new Purchase(
      new PurchaseId('purchase-123'),
      new IngredientName(ingredientName),
      new Quantity(requestedQuantity)
    );
  };

  describe('constructor', () => {
    it('should create purchase with default values', () => {
      const purchase = createPurchase();
      expect(purchase.getId().getValue()).toBe('purchase-123');
      expect(purchase.getIngredientName().getValue()).toBe('tomato');
      expect(purchase.getRequestedQuantity().getValue()).toBe(3);
      expect(purchase.getObtainedQuantity().getValue()).toBe(0);
      expect(purchase.getStatus()).toBe('pending');
      expect(purchase.getPlateId()).toBeNull();
      expect(purchase.getOrderId()).toBeNull();
      expect(purchase.getErrorMessage()).toBeNull();
      expect(purchase.getCreatedAt()).toBeInstanceOf(Date);
      expect(purchase.getCompletedAt()).toBeNull();
    });

    it('should create purchase with plate and order ids', () => {
      const purchase = new Purchase(
        new PurchaseId('purchase-123'),
        new IngredientName('tomato'),
        new Quantity(3),
        Quantity.zero(),
        'pending',
        'plate-456',
        'order-789'
      );
      expect(purchase.getPlateId()).toBe('plate-456');
      expect(purchase.getOrderId()).toBe('order-789');
    });
  });

  describe('markAsCompleted', () => {
    it('should mark purchase as completed with obtained quantity', () => {
      const purchase = createPurchase();
      purchase.markAsCompleted(new Quantity(2));

      expect(purchase.getStatus()).toBe('completed');
      expect(purchase.getObtainedQuantity().getValue()).toBe(2);
      expect(purchase.getCompletedAt()).toBeInstanceOf(Date);
    });

    it('should allow completing with zero quantity', () => {
      const purchase = createPurchase();
      purchase.markAsCompleted(Quantity.zero());

      expect(purchase.getStatus()).toBe('completed');
      expect(purchase.getObtainedQuantity().getValue()).toBe(0);
    });
  });

  describe('markAsFailed', () => {
    it('should mark purchase as failed with error message', () => {
      const purchase = createPurchase();
      purchase.markAsFailed('Market unavailable');

      expect(purchase.getStatus()).toBe('failed');
      expect(purchase.getErrorMessage()).toBe('Market unavailable');
      expect(purchase.getCompletedAt()).toBeInstanceOf(Date);
    });
  });

  describe('status checks', () => {
    it('isSuccessful should return true when completed with quantity > 0', () => {
      const purchase = createPurchase();
      purchase.markAsCompleted(new Quantity(2));
      expect(purchase.isSuccessful()).toBe(true);
    });

    it('isSuccessful should return false when completed with zero quantity', () => {
      const purchase = createPurchase();
      purchase.markAsCompleted(Quantity.zero());
      expect(purchase.isSuccessful()).toBe(false);
    });

    it('isSuccessful should return false when failed', () => {
      const purchase = createPurchase();
      purchase.markAsFailed('Error');
      expect(purchase.isSuccessful()).toBe(false);
    });

    it('isPending should return true for new purchase', () => {
      const purchase = createPurchase();
      expect(purchase.isPending()).toBe(true);
    });

    it('isPending should return false after completion', () => {
      const purchase = createPurchase();
      purchase.markAsCompleted(new Quantity(2));
      expect(purchase.isPending()).toBe(false);
    });

    it('isFailed should return true when failed', () => {
      const purchase = createPurchase();
      purchase.markAsFailed('Error');
      expect(purchase.isFailed()).toBe(true);
    });
  });

  describe('toPrimitives', () => {
    it('should serialize to primitives', () => {
      const purchase = createPurchase();
      purchase.markAsCompleted(new Quantity(2));
      const primitives = purchase.toPrimitives();

      expect(primitives.id).toBe('purchase-123');
      expect(primitives.ingredientName).toBe('tomato');
      expect(primitives.requestedQuantity).toBe(3);
      expect(primitives.obtainedQuantity).toBe(2);
      expect(primitives.status).toBe('completed');
      expect(primitives.createdAt).toBeDefined();
      expect(primitives.completedAt).toBeDefined();
    });
  });

  describe('fromPrimitives', () => {
    it('should deserialize from primitives', () => {
      const purchase = Purchase.fromPrimitives({
        id: 'purchase-456',
        ingredientName: 'cheese',
        requestedQuantity: 5,
        obtainedQuantity: 3,
        status: 'completed',
        plateId: 'plate-123',
        orderId: 'order-456',
        errorMessage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        completedAt: '2024-01-01T00:01:00.000Z',
      });

      expect(purchase.getId().getValue()).toBe('purchase-456');
      expect(purchase.getIngredientName().getValue()).toBe('cheese');
      expect(purchase.getRequestedQuantity().getValue()).toBe(5);
      expect(purchase.getObtainedQuantity().getValue()).toBe(3);
      expect(purchase.getStatus()).toBe('completed');
      expect(purchase.getPlateId()).toBe('plate-123');
    });
  });

  describe('create factory', () => {
    it('should create pending purchase', () => {
      const purchase = Purchase.create('tomato', 3, 'plate-123', 'order-456');

      expect(purchase.getIngredientName().getValue()).toBe('tomato');
      expect(purchase.getRequestedQuantity().getValue()).toBe(3);
      expect(purchase.getObtainedQuantity().getValue()).toBe(0);
      expect(purchase.getStatus()).toBe('pending');
      expect(purchase.getPlateId()).toBe('plate-123');
      expect(purchase.getOrderId()).toBe('order-456');
    });

    it('should create purchase without plate and order ids', () => {
      const purchase = Purchase.create('tomato', 3);
      expect(purchase.getPlateId()).toBeNull();
      expect(purchase.getOrderId()).toBeNull();
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const purchase1 = createPurchase('tomato', 3);
      const purchase2 = new Purchase(
        new PurchaseId('purchase-123'),
        new IngredientName('cheese'),
        new Quantity(10)
      );
      expect(purchase1.equals(purchase2)).toBe(true);
    });

    it('should return false for different id', () => {
      const purchase1 = createPurchase('tomato', 3);
      const purchase2 = new Purchase(
        new PurchaseId('purchase-456'),
        new IngredientName('tomato'),
        new Quantity(3)
      );
      expect(purchase1.equals(purchase2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const purchase = createPurchase('tomato', 3);
      purchase.markAsCompleted(new Quantity(2));
      expect(purchase.toString()).toBe('Purchase(tomato: 2/3 - completed)');
    });
  });
});
