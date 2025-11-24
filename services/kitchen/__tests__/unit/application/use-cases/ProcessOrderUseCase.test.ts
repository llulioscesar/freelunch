/**
 * Unit Tests: ProcessOrderUseCase
 */
import { ProcessOrderUseCase } from '../../../../src/application/use-cases/ProcessOrderUseCase';
import { PlateRepository } from '../../../../src/domain/repositories/PlateRepository';
import { EventPublisher } from '../../../../src/application/ports/out/EventPublisher';
import { Plate } from '../../../../src/domain/entities/Plate';

describe('ProcessOrderUseCase', () => {
  let useCase: ProcessOrderUseCase;
  let mockPlateRepository: jest.Mocked<PlateRepository>;
  let mockEventPublisher: jest.Mocked<EventPublisher>;

  beforeEach(() => {
    // Create mocks
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
    } as jest.Mocked<PlateRepository>;

    mockEventPublisher = {
      publish: jest.fn(),
      publishBatch: jest.fn(),
    } as jest.Mocked<EventPublisher>;

    useCase = new ProcessOrderUseCase(mockPlateRepository, mockEventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create plates for each order item', async () => {
      const input = {
        orderId: 'order-123',
        items: [
          { itemId: 'item-1', orderId: 'order-123' },
          { itemId: 'item-2', orderId: 'order-123' },
        ],
        quantity: 2,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.platesCreated).toBe(2);
      expect(result.plates).toHaveLength(2);
      expect(mockPlateRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should save each plate with correct order reference', async () => {
      const input = {
        orderId: 'order-456',
        items: [{ itemId: 'item-1', orderId: 'order-456' }],
        quantity: 1,
      };

      await useCase.execute(input);

      expect(mockPlateRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getOrderReference: expect.any(Function),
        })
      );

      const savedPlate = mockPlateRepository.save.mock.calls[0][0] as Plate;
      expect(savedPlate.getOrderReference().getOrderId()).toBe('order-456');
      expect(savedPlate.getOrderReference().getOrderItemId()).toBe('item-1');
    });

    it('should return plate IDs and order item IDs', async () => {
      const input = {
        orderId: 'order-789',
        items: [
          { itemId: 'item-1', orderId: 'order-789' },
          { itemId: 'item-2', orderId: 'order-789' },
        ],
        quantity: 2,
      };

      const result = await useCase.execute(input);

      expect(result.plates).toHaveLength(2);
      expect(result.plates[0]).toHaveProperty('plateId');
      expect(result.plates[0]).toHaveProperty('orderItemId');
      expect(result.plates[0]).toHaveProperty('status', 'PENDING');
    });

    it('should throw error for invalid order data', async () => {
      const input = {
        orderId: '',
        items: [],
        quantity: 0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Invalid order data');
    });

    it('should throw error if orderId is missing', async () => {
      const input = {
        orderId: '',
        items: [{ itemId: 'item-1', dishName: 'Dish A' }],
        quantity: 1,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Invalid order data');
    });

    it('should throw error if items array is empty', async () => {
      const input = {
        orderId: 'order-123',
        items: [],
        quantity: 0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Invalid order data');
    });

    it('should handle repository errors', async () => {
      const input = {
        orderId: 'order-123',
        items: [{ itemId: 'item-1', orderId: 'order-123' }],
        quantity: 1,
      };

      mockPlateRepository.save.mockRejectedValueOnce(new Error('Database error'));

      await expect(useCase.execute(input)).rejects.toThrow('Database error');
    });

    it('should return correct message in response', async () => {
      const input = {
        orderId: 'order-123',
        items: [{ itemId: 'item-1', orderId: 'order-123' }],
        quantity: 1,
      };

      const result = await useCase.execute(input);

      expect(result.message).toBe('Created 1 plates for preparation');
    });
  });
});
