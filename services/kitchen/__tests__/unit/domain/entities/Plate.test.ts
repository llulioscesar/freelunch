/**
 * Unit Tests: Plate Entity
 */
import { Plate } from '../../../../src/domain/entities/Plate';
import { PlateId } from '../../../../src/domain/value-objects/PlateId';
import { RecipeId } from '../../../../src/domain/value-objects/RecipeId';
import { OrderReference } from '../../../../src/domain/value-objects/OrderReference';
import { Ingredients } from '../../../../src/domain/value-objects/Ingredients';
import { PlateStatusEnum } from '../../../../src/domain/value-objects/PlateStatus';

describe('Plate Entity', () => {
  let plateId: PlateId;
  let orderReference: OrderReference;

  beforeEach(() => {
    plateId = new PlateId();
    orderReference = new OrderReference('order-123', 'item-456');
  });

  describe('Constructor', () => {
    it('should create a new Plate in PENDING status', () => {
      const plate = new Plate(plateId, orderReference);

      expect(plate.getId()).toBe(plateId);
      expect(plate.getOrderReference()).toBe(orderReference);
      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.PENDING);
      expect(plate.getRecipeId()).toBeUndefined();
      expect(plate.getIngredients()).toBeUndefined();
    });
  });

  describe('assignRecipe', () => {
    it('should assign recipe to PENDING plate', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2, onion: 1 });

      plate.assignRecipe(recipeId, 'Tomato Salad', ingredients);

      expect(plate.getRecipeId()).toBe(recipeId);
      expect(plate.getRecipeName()).toBe('Tomato Salad');
      expect(plate.getIngredients()).toBe(ingredients);
      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.ASSIGNED);
      expect(plate.getAssignedAt()).toBeInstanceOf(Date);
    });

    it('should emit PlateAssignedEvent', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);

      const events = plate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('kitchen.plate.assigned');
    });

    it('should throw error if plate is not PENDING', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);

      expect(() => plate.assignRecipe(recipeId, 'Recipe2', ingredients))
        .toThrow('Can only assign recipe to pending plates');
    });
  });

  describe('requestIngredients', () => {
    it('should request ingredients for ASSIGNED plate', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.clearDomainEvents();
      plate.requestIngredients();

      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.REQUESTING_INGREDIENTS);
    });

    it('should emit IngredientsRequestedEvent', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.clearDomainEvents();
      plate.requestIngredients();

      const events = plate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('kitchen.ingredients.requested');
    });

    it('should throw error if plate is not ASSIGNED', () => {
      const plate = new Plate(plateId, orderReference);

      expect(() => plate.requestIngredients())
        .toThrow('Plate must be assigned before requesting ingredients');
    });
  });

  describe('startCooking', () => {
    it('should start cooking for plate with requested ingredients', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();

      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.COOKING);
      expect(plate.getCookingAt()).toBeInstanceOf(Date);
    });

    it('should throw error if ingredients not requested', () => {
      const plate = new Plate(plateId, orderReference);

      expect(() => plate.startCooking())
        .toThrow('Plate must be requesting ingredients before cooking');
    });
  });

  describe('markAsReady', () => {
    it('should mark COOKING plate as READY', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();
      plate.clearDomainEvents();
      plate.markAsReady();

      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.READY);
      expect(plate.getReadyAt()).toBeInstanceOf(Date);
    });

    it('should emit PlateReadyEvent', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();
      plate.clearDomainEvents();
      plate.markAsReady();

      const events = plate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('kitchen.plate.ready');
    });

    it('should throw error if plate is not COOKING', () => {
      const plate = new Plate(plateId, orderReference);

      expect(() => plate.markAsReady())
        .toThrow('Plate must be cooking to mark as ready');
    });
  });

  describe('markAsFailed', () => {
    it('should mark plate as FAILED with reason', () => {
      const plate = new Plate(plateId, orderReference);
      const reason = 'Ingredients not available';

      plate.markAsFailed(reason);

      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.FAILED);
      expect(plate.getFailureReason()).toBe(reason);
    });

    it('should emit PlateFailedEvent', () => {
      const plate = new Plate(plateId, orderReference);

      plate.clearDomainEvents();
      plate.markAsFailed('Test failure');

      const events = plate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('kitchen.plate.failed');
    });

    it('should allow marking READY plate as FAILED', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();
      plate.markAsReady();

      // markAsFailed doesn't prevent marking ready plates as failed
      plate.markAsFailed('Test');

      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.FAILED);
      expect(plate.getFailureReason()).toBe('Test');
    });
  });

  describe('getRetryCount', () => {
    it('should return initial retry count as 0', () => {
      const plate = new Plate(plateId, orderReference);

      expect(plate.getRetryCount()).toBe(0);
    });
  });

  describe('Domain Events', () => {
    it('should accumulate multiple events', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();

      const events = plate.getDomainEvents();
      expect(events).toHaveLength(2);
    });

    it('should clear events after retrieval', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.clearDomainEvents();

      const events = plate.getDomainEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('fromPrimitives', () => {
    it('should reconstruct Plate from primitives', () => {
      const primitives = {
        id: 'plate-123',
        orderId: 'order-456',
        orderItemId: 'item-789',
        recipeId: 'recipe-abc',
        recipeName: 'Test Recipe',
        ingredients: { tomato: 2, onion: 1 },
        status: PlateStatusEnum.COOKING,
        createdAt: new Date().toISOString(),
        assignedAt: new Date().toISOString(),
        cookingAt: new Date().toISOString(),
        readyAt: null,
        failureReason: null,
        retryCount: 0,
      };

      const plate = Plate.fromPrimitives(primitives);

      expect(plate.getId().getValue()).toBe('plate-123');
      expect(plate.getRecipeId()?.getValue()).toBe('recipe-abc');
      expect(plate.getRecipeName()).toBe('Test Recipe');
      expect(plate.getStatus().getValue()).toBe(PlateStatusEnum.COOKING);
    });
  });

  describe('toPrimitives', () => {
    it('should convert Plate to primitives', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Recipe', ingredients);

      const primitives = plate.toPrimitives();

      expect(primitives.id).toBe(plateId.getValue());
      expect(primitives.orderId).toBe('order-123');
      expect(primitives.orderItemId).toBe('item-456');
      expect(primitives.recipeId).toBe(recipeId.getValue());
      expect(primitives.status).toBe(PlateStatusEnum.ASSIGNED);
    });
  });

  describe('Business rules - Status checks', () => {
    it('should check if plate is pending', () => {
      const plate = new Plate(plateId, orderReference);
      expect(plate.isPending()).toBe(true);
    });

    it('should check if plate is assigned', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      expect(plate.isAssigned()).toBe(true);
    });

    it('should check if plate is requesting ingredients', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      expect(plate.isRequestingIngredients()).toBe(true);
    });

    it('should check if plate is cooking', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();
      expect(plate.isCooking()).toBe(true);
    });

    it('should check if plate is ready', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();
      plate.markAsReady();
      expect(plate.isReady()).toBe(true);
    });

    it('should check if plate is failed', () => {
      const plate = new Plate(plateId, orderReference);
      plate.markAsFailed('Test');
      expect(plate.isFailed()).toBe(true);
    });

    it('should check if plate is completed', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();
      plate.markAsReady();
      expect(plate.isCompleted()).toBe(true);
    });
  });

  describe('Business rules - Preparation time', () => {
    it('should return null preparation time for unfinished plate', () => {
      const plate = new Plate(plateId, orderReference);
      expect(plate.getPreparationTime()).toBeNull();
    });

    it('should calculate preparation time for ready plate', () => {
      const plate = new Plate(plateId, orderReference);
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      plate.assignRecipe(recipeId, 'Recipe', ingredients);
      plate.requestIngredients();
      plate.startCooking();
      plate.markAsReady();
      const prepTime = plate.getPreparationTime();
      expect(prepTime).not.toBeNull();
      expect(typeof prepTime).toBe('number');
    });
  });

  describe('Business rules - Retry capability', () => {
    it('should allow retry for failed plate with retries remaining', () => {
      const plate = new Plate(plateId, orderReference);
      plate.markAsFailed('Test');
      expect(plate.canRetry()).toBe(true);
    });

    it('should not allow retry for non-failed plate', () => {
      const plate = new Plate(plateId, orderReference);
      expect(plate.canRetry()).toBe(false);
    });
  });
});
