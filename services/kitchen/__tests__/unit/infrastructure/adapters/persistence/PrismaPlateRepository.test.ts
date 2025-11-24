import { PrismaPlateRepository } from '../../../../../src/infrastructure/adapters/persistence/PrismaPlateRepository.js';
import { Plate } from '../../../../../src/domain/entities/Plate.js';
import { PlateId } from '../../../../../src/domain/value-objects/PlateId.js';
import { OrderReference } from '../../../../../src/domain/value-objects/OrderReference.js';
import { PlateStatusEnum } from '../../../../../src/domain/value-objects/PlateStatus.js';
import { RecipeId } from '../../../../../src/domain/value-objects/RecipeId.js';
import { Ingredients } from '../../../../../src/domain/value-objects/Ingredients.js';

describe('PrismaPlateRepository', () => {
  let repository: PrismaPlateRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      plate: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    repository = new PrismaPlateRepository(mockPrisma);
  });

  describe('save', () => {
    it('should save a new plate', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);

      mockPrisma.plate.upsert.mockResolvedValue({});

      await repository.save(plate);

      expect(mockPrisma.plate.upsert).toHaveBeenCalledWith({
        where: { id: 'plate-123' },
        create: expect.objectContaining({
          id: 'plate-123',
          orderId: 'order-456',
          orderItemId: 'item-789',
          status: PlateStatusEnum.PENDING,
        }),
        update: expect.any(Object),
      });
    });

    it('should save a plate with recipe assigned', async () => {
      const plateId = new PlateId('plate-123');
      const orderRef = new OrderReference('order-456', 'item-789');
      const plate = new Plate(plateId, orderRef);
      const recipeId = new RecipeId('recipe-abc');
      const ingredients = new Ingredients({ tomato: 2 });

      plate.assignRecipe(recipeId, 'Tomato Salad', ingredients);
      mockPrisma.plate.upsert.mockResolvedValue({});

      await repository.save(plate);

      expect(mockPrisma.plate.upsert).toHaveBeenCalledWith({
        where: { id: 'plate-123' },
        create: expect.objectContaining({
          recipeId: 'recipe-abc',
          recipeName: 'Tomato Salad',
          status: PlateStatusEnum.ASSIGNED,
        }),
        update: expect.any(Object),
      });
    });
  });

  describe('findById', () => {
    it('should find plate by id', async () => {
      const plateId = new PlateId('plate-123');

      mockPrisma.plate.findUnique.mockResolvedValue({
        id: 'plate-123',
        orderId: 'order-456',
        orderItemId: 'item-789',
        recipeId: null,
        recipeName: null,
        ingredients: null,
        status: PlateStatusEnum.PENDING,
        createdAt: new Date('2025-01-01'),
        assignedAt: null,
        cookingAt: null,
        readyAt: null,
        failureReason: null,
        retryCount: 0,
      });

      const plate = await repository.findById(plateId);

      expect(plate).not.toBeNull();
      expect(plate?.getId().getValue()).toBe('plate-123');
      expect(mockPrisma.plate.findUnique).toHaveBeenCalledWith({
        where: { id: 'plate-123' },
      });
    });

    it('should return null if plate not found', async () => {
      const plateId = new PlateId('plate-999');
      mockPrisma.plate.findUnique.mockResolvedValue(null);

      const plate = await repository.findById(plateId);

      expect(plate).toBeNull();
    });
  });

  describe('findByOrderItemId', () => {
    it('should find plate by order item id', async () => {
      mockPrisma.plate.findUnique.mockResolvedValue({
        id: 'plate-123',
        orderId: 'order-456',
        orderItemId: 'item-789',
        recipeId: null,
        recipeName: null,
        ingredients: null,
        status: PlateStatusEnum.PENDING,
        createdAt: new Date('2025-01-01'),
        assignedAt: null,
        cookingAt: null,
        readyAt: null,
        failureReason: null,
        retryCount: 0,
      });

      const plate = await repository.findByOrderItemId('item-789');

      expect(plate).not.toBeNull();
      expect(plate?.getOrderReference().getOrderItemId()).toBe('item-789');
    });

    it('should return null if not found', async () => {
      mockPrisma.plate.findUnique.mockResolvedValue(null);

      const plate = await repository.findByOrderItemId('item-999');

      expect(plate).toBeNull();
    });
  });

  describe('findByOrderId', () => {
    it('should find all plates for an order', async () => {
      mockPrisma.plate.findMany.mockResolvedValue([
        {
          id: 'plate-1',
          orderId: 'order-456',
          orderItemId: 'item-1',
          recipeId: null,
          recipeName: null,
          ingredients: null,
          status: PlateStatusEnum.PENDING,
          createdAt: new Date('2025-01-01'),
          assignedAt: null,
          cookingAt: null,
          readyAt: null,
          failureReason: null,
          retryCount: 0,
        },
        {
          id: 'plate-2',
          orderId: 'order-456',
          orderItemId: 'item-2',
          recipeId: null,
          recipeName: null,
          ingredients: null,
          status: PlateStatusEnum.PENDING,
          createdAt: new Date('2025-01-01'),
          assignedAt: null,
          cookingAt: null,
          readyAt: null,
          failureReason: null,
          retryCount: 0,
        },
      ]);

      const plates = await repository.findByOrderId('order-456');

      expect(plates).toHaveLength(2);
      expect(plates[0].getOrderReference().getOrderId()).toBe('order-456');
      expect(plates[1].getOrderReference().getOrderId()).toBe('order-456');
    });

    it('should return empty array if no plates found', async () => {
      mockPrisma.plate.findMany.mockResolvedValue([]);

      const plates = await repository.findByOrderId('order-999');

      expect(plates).toHaveLength(0);
    });
  });

  describe('findByStatus', () => {
    it('should find plates by status', async () => {
      mockPrisma.plate.findMany.mockResolvedValue([
        {
          id: 'plate-1',
          orderId: 'order-456',
          orderItemId: 'item-1',
          recipeId: 'recipe-abc',
          recipeName: 'Recipe',
          ingredients: { tomato: 2 },
          status: PlateStatusEnum.COOKING,
          createdAt: new Date('2025-01-01'),
          assignedAt: new Date('2025-01-01'),
          cookingAt: new Date('2025-01-01'),
          readyAt: null,
          failureReason: null,
          retryCount: 0,
        },
      ]);

      const plates = await repository.findByStatus(PlateStatusEnum.COOKING);

      expect(plates).toHaveLength(1);
      expect(plates[0].isCooking()).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should find all plates', async () => {
      mockPrisma.plate.findMany.mockResolvedValue([
        {
          id: 'plate-1',
          orderId: 'order-456',
          orderItemId: 'item-1',
          recipeId: null,
          recipeName: null,
          ingredients: null,
          status: PlateStatusEnum.PENDING,
          createdAt: new Date('2025-01-01'),
          assignedAt: null,
          cookingAt: null,
          readyAt: null,
          failureReason: null,
          retryCount: 0,
        },
      ]);

      const plates = await repository.findAll();

      expect(plates).toHaveLength(1);
      expect(mockPrisma.plate.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findInProgress', () => {
    it('should find plates in progress', async () => {
      mockPrisma.plate.findMany.mockResolvedValue([
        {
          id: 'plate-1',
          orderId: 'order-456',
          orderItemId: 'item-1',
          recipeId: 'recipe-abc',
          recipeName: 'Recipe',
          ingredients: { tomato: 2 },
          status: PlateStatusEnum.ASSIGNED,
          createdAt: new Date('2025-01-01'),
          assignedAt: new Date('2025-01-01'),
          cookingAt: null,
          readyAt: null,
          failureReason: null,
          retryCount: 0,
        },
      ]);

      const plates = await repository.findInProgress();

      expect(plates).toHaveLength(1);
      expect(mockPrisma.plate.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [
              PlateStatusEnum.ASSIGNED,
              PlateStatusEnum.REQUESTING_INGREDIENTS,
              PlateStatusEnum.COOKING,
            ],
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('delete', () => {
    it('should delete a plate', async () => {
      const plateId = new PlateId('plate-123');
      mockPrisma.plate.delete.mockResolvedValue({});

      await repository.delete(plateId);

      expect(mockPrisma.plate.delete).toHaveBeenCalledWith({
        where: { id: 'plate-123' },
      });
    });
  });

  describe('countByStatus', () => {
    it('should count plates by status', async () => {
      mockPrisma.plate.count.mockResolvedValue(5);

      const count = await repository.countByStatus(PlateStatusEnum.PENDING);

      expect(count).toBe(5);
      expect(mockPrisma.plate.count).toHaveBeenCalledWith({
        where: { status: PlateStatusEnum.PENDING },
      });
    });
  });

  describe('count', () => {
    it('should count all plates', async () => {
      mockPrisma.plate.count.mockResolvedValue(10);

      const count = await repository.count();

      expect(count).toBe(10);
      expect(mockPrisma.plate.count).toHaveBeenCalledWith();
    });
  });
});
