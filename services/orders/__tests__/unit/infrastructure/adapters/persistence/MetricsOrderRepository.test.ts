/**
 * Unit Tests: MetricsOrderRepository (Decorator with mocks)
 */
import { MetricsOrderRepository } from '../../../../../src/infrastructure/adapters/persistence/MetricsOrderRepository';
import { OrderRepository } from '../../../../../src/domain/repositories/OrderRepository';
import { Order } from '../../../../../src/domain/entities/Order';
import { OrderId } from '../../../../../src/domain/value-objects/OrderId';
import { Quantity } from '../../../../../src/domain/value-objects/Quantity';
import { CustomerInfo } from '../../../../../src/domain/value-objects/CustomerInfo';

// Mock the metrics service
jest.mock('../../../../../src/infrastructure/metrics/MetricsService', () => ({
  metricsService: {
    recordDatabaseQuery: jest.fn(),
  },
}));

import { metricsService } from '../../../../../src/infrastructure/metrics/MetricsService';

describe('MetricsOrderRepository (Decorator with Mocks)', () => {
  let mockRepository: jest.Mocked<OrderRepository>;
  let metricsRepository: MetricsOrderRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    metricsRepository = new MetricsOrderRepository(mockRepository);
  });

  describe('save', () => {
    it('should call underlying repository and record metrics', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      mockRepository.save.mockResolvedValue();

      await metricsRepository.save(order);

      expect(mockRepository.save).toHaveBeenCalledWith(order);
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'insert',
        expect.any(Number),
        false
      );
    });

    it('should record error metrics when save fails', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(metricsRepository.save(order)).rejects.toThrow('Database error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'insert',
        expect.any(Number),
        true
      );
    });
  });

  describe('findById', () => {
    it('should call underlying repository and record metrics', async () => {
      const orderId = new OrderId();
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));
      mockRepository.findById.mockResolvedValue(order);

      const result = await metricsRepository.findById(orderId);

      expect(result).toBe(order);
      expect(mockRepository.findById).toHaveBeenCalledWith(orderId);
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'select',
        expect.any(Number),
        false
      );
    });

    it('should record error metrics when findById fails', async () => {
      const orderId = new OrderId();
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(metricsRepository.findById(orderId)).rejects.toThrow('Database error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'select',
        expect.any(Number),
        true
      );
    });
  });

  describe('findAll', () => {
    it('should call underlying repository and record metrics', async () => {
      const orders = [
        new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test 1')),
        new Order(new OrderId(), new Quantity(2), new CustomerInfo('Test 2')),
      ];
      mockRepository.findAll.mockResolvedValue(orders);

      const result = await metricsRepository.findAll();

      expect(result).toBe(orders);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'select',
        expect.any(Number),
        false
      );
    });

    it('should record error metrics when findAll fails', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(metricsRepository.findAll()).rejects.toThrow('Database error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'select',
        expect.any(Number),
        true
      );
    });
  });

  describe('count', () => {
    it('should call underlying repository and record metrics', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await metricsRepository.count();

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalled();
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'count',
        expect.any(Number),
        false
      );
    });

    it('should record error metrics when count fails', async () => {
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(metricsRepository.count()).rejects.toThrow('Database error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'count',
        expect.any(Number),
        true
      );
    });
  });

  describe('update', () => {
    it('should call underlying repository and record metrics', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      mockRepository.update.mockResolvedValue();

      await metricsRepository.update(order);

      expect(mockRepository.update).toHaveBeenCalledWith(order);
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'update',
        expect.any(Number),
        false
      );
    });

    it('should record error metrics when update fails', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(metricsRepository.update(order)).rejects.toThrow('Database error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'update',
        expect.any(Number),
        true
      );
    });
  });

  describe('delete', () => {
    it('should call underlying repository and record metrics', async () => {
      const orderId = new OrderId();
      mockRepository.delete.mockResolvedValue();

      await metricsRepository.delete(orderId);

      expect(mockRepository.delete).toHaveBeenCalledWith(orderId);
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'delete',
        expect.any(Number),
        false
      );
    });

    it('should record error metrics when delete fails', async () => {
      const orderId = new OrderId();
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(metricsRepository.delete(orderId)).rejects.toThrow('Database error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'delete',
        expect.any(Number),
        true
      );
    });
  });

  describe('exists', () => {
    it('should call underlying repository and record metrics', async () => {
      const orderId = new OrderId();
      mockRepository.exists.mockResolvedValue(true);

      const result = await metricsRepository.exists(orderId);

      expect(result).toBe(true);
      expect(mockRepository.exists).toHaveBeenCalledWith(orderId);
      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'exists',
        expect.any(Number),
        false
      );
    });

    it('should record error metrics when exists fails', async () => {
      const orderId = new OrderId();
      mockRepository.exists.mockRejectedValue(new Error('Database error'));

      await expect(metricsRepository.exists(orderId)).rejects.toThrow('Database error');

      expect(metricsService.recordDatabaseQuery).toHaveBeenCalledWith(
        'exists',
        expect.any(Number),
        true
      );
    });
  });
});
