/**
 * Metrics Decorator for OrderRepository
 *
 * Wraps any OrderRepository implementation and records database metrics.
 * Uses Decorator pattern to add observability without modifying existing code.
 */
import { OrderRepository, OrderFilters } from '../../../domain/repositories/OrderRepository';
import { Order } from '../../../domain/entities/Order';
import { OrderId } from '../../../domain/value-objects/OrderId';
import { metricsService } from '../../metrics/MetricsService';

export class MetricsOrderRepository implements OrderRepository {
  constructor(private readonly repository: OrderRepository) {}

  async save(order: Order): Promise<void> {
    const startTime = Date.now();
    let error = false;

    try {
      await this.repository.save(order);
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery('insert', durationSeconds, error);
    }
  }

  async findById(id: OrderId): Promise<Order | null> {
    const startTime = Date.now();
    let error = false;

    try {
      return await this.repository.findById(id);
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery('select', durationSeconds, error);
    }
  }

  async findAll(filters?: OrderFilters): Promise<Order[]> {
    const startTime = Date.now();
    let error = false;

    try {
      return await this.repository.findAll(filters);
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery('select', durationSeconds, error);
    }
  }

  async count(filters?: OrderFilters): Promise<number> {
    const startTime = Date.now();
    let error = false;

    try {
      return await this.repository.count(filters);
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery('count', durationSeconds, error);
    }
  }

  async update(order: Order): Promise<void> {
    const startTime = Date.now();
    let error = false;

    try {
      await this.repository.update(order);
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery('update', durationSeconds, error);
    }
  }

  async delete(id: OrderId): Promise<void> {
    const startTime = Date.now();
    let error = false;

    try {
      await this.repository.delete(id);
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery('delete', durationSeconds, error);
    }
  }

  async exists(id: OrderId): Promise<boolean> {
    const startTime = Date.now();
    let error = false;

    try {
      return await this.repository.exists(id);
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const durationSeconds = (Date.now() - startTime) / 1000;
      metricsService.recordDatabaseQuery('exists', durationSeconds, error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.repository.disconnect) {
      return this.repository.disconnect();
    }
  }
}
