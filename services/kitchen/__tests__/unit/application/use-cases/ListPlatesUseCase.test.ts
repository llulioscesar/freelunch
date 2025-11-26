/**
 * Unit Tests: ListPlatesUseCase
 */
import { ListPlatesUseCase } from '../../../../src/application/use-cases/ListPlatesUseCase';
import { PlateRepository } from '../../../../src/domain/repositories/PlateRepository';
import { Plate } from '../../../../src/domain/entities/Plate';
import { PlateId } from '../../../../src/domain/value-objects/PlateId';
import { OrderReference } from '../../../../src/domain/value-objects/OrderReference';
import { PlateStatusEnum } from '../../../../src/domain/value-objects/PlateStatus';
import { RecipeId } from '../../../../src/domain/value-objects/RecipeId';
import { Ingredients } from '../../../../src/domain/value-objects/Ingredients';

describe('ListPlatesUseCase', () => {
  let useCase: ListPlatesUseCase;
  let mockPlateRepository: jest.Mocked<PlateRepository>;

  beforeEach(() => {
    mockPlateRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrderItemId: jest.fn(),
      findByOrderId: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
      findInProgress: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
      count: jest.fn(),
      getCountsByStatus: jest.fn(),
      getRecipeStats: jest.fn(),
      getFailureReasons: jest.fn(),
    } as jest.Mocked<PlateRepository>;

    useCase = new ListPlatesUseCase(mockPlateRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - without filters', () => {
    it('should return all plates', async () => {
      const plate1 = new Plate(new PlateId(), new OrderReference('order-1', 'item-1'));
      const plate2 = new Plate(new PlateId(), new OrderReference('order-2', 'item-2'));

      mockPlateRepository.findAll.mockResolvedValue([plate1, plate2]);

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.plates).toHaveLength(2);
      expect(mockPlateRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no plates exist', async () => {
      mockPlateRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
      expect(result.plates).toHaveLength(0);
    });
  });

  describe('execute - filter by status', () => {
    it('should filter plates by status', async () => {
      const plate1 = new Plate(new PlateId(), new OrderReference('order-1', 'item-1'));
      const recipeId = new RecipeId();
      const ingredients = new Ingredients({ tomato: 2 });
      plate1.assignRecipe(recipeId, 'Recipe', ingredients);

      mockPlateRepository.findByStatus.mockResolvedValue([plate1]);

      const result = await useCase.execute({ status: PlateStatusEnum.ASSIGNED });

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(mockPlateRepository.findByStatus).toHaveBeenCalledWith(PlateStatusEnum.ASSIGNED);
    });
  });

  describe('execute - filter by orderId', () => {
    it('should filter plates by orderId', async () => {
      const plate1 = new Plate(new PlateId(), new OrderReference('order-123', 'item-1'));
      const plate2 = new Plate(new PlateId(), new OrderReference('order-123', 'item-2'));

      mockPlateRepository.findByOrderId.mockResolvedValue([plate1, plate2]);

      const result = await useCase.execute({ orderId: 'order-123' });

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(mockPlateRepository.findByOrderId).toHaveBeenCalledWith('order-123');
    });
  });

  describe('execute - with stats', () => {
    it('should include stats when requested', async () => {
      const plate1 = new Plate(new PlateId(), new OrderReference('order-1', 'item-1'));
      const plate2 = new Plate(new PlateId(), new OrderReference('order-2', 'item-2'));

      mockPlateRepository.findAll.mockResolvedValue([plate1, plate2]);
      mockPlateRepository.countByStatus
        .mockResolvedValueOnce(2)  // PENDING
        .mockResolvedValueOnce(0)  // ASSIGNED
        .mockResolvedValueOnce(0)  // REQUESTING_INGREDIENTS
        .mockResolvedValueOnce(0)  // COOKING
        .mockResolvedValueOnce(0)  // READY
        .mockResolvedValueOnce(0); // FAILED

      const result = await useCase.execute({ includeStats: true });

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.pending).toBe(2);
      expect(mockPlateRepository.countByStatus).toHaveBeenCalled();
    });

    it('should not include stats when not requested', async () => {
      mockPlateRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute({ includeStats: false });

      expect(result.stats).toBeUndefined();
      expect(mockPlateRepository.countByStatus).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle repository errors', async () => {
      mockPlateRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute({})).rejects.toThrow('Database error');
    });
  });
});
