import { HistoryTrackingPlateRepository } from '../../../../../src/infrastructure/adapters/persistence/HistoryTrackingPlateRepository';
import { PlateRepository } from '../../../../../src/domain/repositories/PlateRepository';
import { StatusHistoryRepository } from '../../../../../src/domain/repositories/StatusHistoryRepository';
import { Plate } from '../../../../../src/domain/entities/Plate';
import { PlateId } from '../../../../../src/domain/value-objects/PlateId';
import { OrderReference } from '../../../../../src/domain/value-objects/OrderReference';
import { PlateStatusEnum } from '../../../../../src/domain/value-objects/PlateStatus';

describe('HistoryTrackingPlateRepository', () => {
  let repository: HistoryTrackingPlateRepository;
  let mockDelegate: jest.Mocked<PlateRepository>;
  let mockHistoryRepo: jest.Mocked<StatusHistoryRepository>;

  beforeEach(() => {
    mockDelegate = {
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
    };

    mockHistoryRepo = {
      record: jest.fn(),
      findByPlateId: jest.fn(),
      findByOrderId: jest.fn(),
      findRecent: jest.fn(),
    };

    repository = new HistoryTrackingPlateRepository(mockDelegate, mockHistoryRepo);
  });

  describe('save', () => {
    it('should save plate and record history for new plate', async () => {
      const plateId = new PlateId();
      const orderRef = new OrderReference('order-1', 'item-1');
      const plate = new Plate(plateId, orderRef);

      mockDelegate.findById.mockResolvedValue(null); // New plate
      mockDelegate.save.mockResolvedValue(undefined);
      mockHistoryRepo.record.mockResolvedValue({
        id: 'h1',
        plateId: plateId.getValue(),
        fromStatus: null,
        toStatus: 'PENDING',
        changedAt: new Date(),
      });

      await repository.save(plate);

      expect(mockDelegate.save).toHaveBeenCalledWith(plate);
      expect(mockHistoryRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          plateId: plateId.getValue(),
          fromStatus: null,
          toStatus: 'PENDING',
        })
      );
    });

    it('should record history when status changes', async () => {
      const plateId = new PlateId();
      const orderRef = new OrderReference('order-1', 'item-1');

      // Existing plate in PENDING status
      const existingPlate = new Plate(plateId, orderRef);

      // Updated plate in ASSIGNED status
      const updatedPlate = new Plate(plateId, orderRef);
      updatedPlate.assignRecipe(
        { getValue: () => 'recipe-1' } as any,
        'Test Recipe',
        { toPrimitives: () => ({ tomato: 2 }) } as any
      );

      mockDelegate.findById.mockResolvedValue(existingPlate);
      mockDelegate.save.mockResolvedValue(undefined);
      mockHistoryRepo.record.mockResolvedValue({
        id: 'h1',
        plateId: plateId.getValue(),
        fromStatus: 'PENDING',
        toStatus: 'ASSIGNED',
        changedAt: new Date(),
      });

      await repository.save(updatedPlate);

      expect(mockDelegate.save).toHaveBeenCalledWith(updatedPlate);
      expect(mockHistoryRepo.record).toHaveBeenCalled();
    });

    it('should not record history if status unchanged', async () => {
      const plateId = new PlateId();
      const orderRef = new OrderReference('order-1', 'item-1');
      const plate = new Plate(plateId, orderRef);

      // Same status
      mockDelegate.findById.mockResolvedValue(plate);
      mockDelegate.save.mockResolvedValue(undefined);

      await repository.save(plate);

      expect(mockDelegate.save).toHaveBeenCalledWith(plate);
      expect(mockHistoryRepo.record).not.toHaveBeenCalled();
    });

    it('should continue if history recording fails', async () => {
      const plateId = new PlateId();
      const orderRef = new OrderReference('order-1', 'item-1');
      const plate = new Plate(plateId, orderRef);

      mockDelegate.findById.mockResolvedValue(null);
      mockDelegate.save.mockResolvedValue(undefined);
      mockHistoryRepo.record.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await expect(repository.save(plate)).resolves.not.toThrow();
      expect(mockDelegate.save).toHaveBeenCalled();
    });
  });

  describe('delegation', () => {
    it('should delegate findById', async () => {
      const plateId = new PlateId();
      mockDelegate.findById.mockResolvedValue(null);

      await repository.findById(plateId);

      expect(mockDelegate.findById).toHaveBeenCalledWith(plateId);
    });

    it('should delegate findByOrderItemId', async () => {
      mockDelegate.findByOrderItemId.mockResolvedValue(null);

      await repository.findByOrderItemId('item-1');

      expect(mockDelegate.findByOrderItemId).toHaveBeenCalledWith('item-1');
    });

    it('should delegate findByOrderId', async () => {
      mockDelegate.findByOrderId.mockResolvedValue([]);

      await repository.findByOrderId('order-1');

      expect(mockDelegate.findByOrderId).toHaveBeenCalledWith('order-1');
    });

    it('should delegate findByStatus', async () => {
      mockDelegate.findByStatus.mockResolvedValue([]);

      await repository.findByStatus(PlateStatusEnum.COOKING);

      expect(mockDelegate.findByStatus).toHaveBeenCalledWith(PlateStatusEnum.COOKING);
    });

    it('should delegate findAll', async () => {
      mockDelegate.findAll.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDelegate.findAll).toHaveBeenCalled();
    });

    it('should delegate findInProgress', async () => {
      mockDelegate.findInProgress.mockResolvedValue([]);

      await repository.findInProgress();

      expect(mockDelegate.findInProgress).toHaveBeenCalled();
    });

    it('should delegate delete', async () => {
      const plateId = new PlateId();
      mockDelegate.delete.mockResolvedValue(undefined);

      await repository.delete(plateId);

      expect(mockDelegate.delete).toHaveBeenCalledWith(plateId);
    });

    it('should delegate countByStatus', async () => {
      mockDelegate.countByStatus.mockResolvedValue(5);

      const result = await repository.countByStatus(PlateStatusEnum.READY);

      expect(mockDelegate.countByStatus).toHaveBeenCalledWith(PlateStatusEnum.READY);
      expect(result).toBe(5);
    });

    it('should delegate count', async () => {
      mockDelegate.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(mockDelegate.count).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });
});
