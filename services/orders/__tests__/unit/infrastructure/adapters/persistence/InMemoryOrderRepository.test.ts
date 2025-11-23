/**
 * Unit Tests: InMemoryOrderRepository
 */
import { InMemoryOrderRepository } from '../../../../../src/infrastructure/adapters/persistence/InMemoryOrderRepository';
import { Order } from '../../../../../src/domain/entities/Order';
import { OrderId } from '../../../../../src/domain/value-objects/OrderId';
import { Quantity } from '../../../../../src/domain/value-objects/Quantity';
import { CustomerInfo } from '../../../../../src/domain/value-objects/CustomerInfo';
import { OrderStatus, OrderStatusEnum } from '../../../../../src/domain/value-objects/OrderStatus';

describe('InMemoryOrderRepository', () => {
  let repository: InMemoryOrderRepository;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
  });

  describe('save', () => {
    it('should save order to memory', async () => {
      const order = new Order(
        new OrderId(),
        new Quantity(2),
        new CustomerInfo('John Doe')
      );

      await repository.save(order);

      const found = await repository.findById(order.getId());
      expect(found).toBeDefined();
      expect(found?.getId().getValue()).toBe(order.getId().getValue());
    });

    it('should overwrite existing order', async () => {
      const orderId = new OrderId();
      const order1 = new Order(orderId, new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(orderId, new Quantity(5), new CustomerInfo('Customer 2'));

      await repository.save(order1);
      await repository.save(order2);

      const found = await repository.findById(orderId);
      expect(found?.getQuantity().getValue()).toBe(5);
      expect(found?.getCustomerInfo().getName()).toBe('Customer 2');
    });
  });

  describe('findById', () => {
    it('should find order by id', async () => {
      const order = new Order(new OrderId(), new Quantity(3), new CustomerInfo('Test'));
      await repository.save(order);

      const found = await repository.findById(order.getId());

      expect(found).toBeDefined();
      expect(found?.getId().getValue()).toBe(order.getId().getValue());
    });

    it('should return null when order not found', async () => {
      const result = await repository.findById(new OrderId('ORD-9999999999-NOTFOUND'));

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all orders', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Customer 2'));

      await repository.save(order1);
      await repository.save(order2);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Customer 2'));
      order2.markAsPreparing();

      await repository.save(order1);
      await repository.save(order2);

      const result = await repository.findAll({
        status: new OrderStatus(OrderStatusEnum.PENDING),
      });

      expect(result).toHaveLength(1);
      expect(result[0].getId().getValue()).toBe(order1.getId().getValue());
    });

    it('should filter by customer name', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('John Doe'));
      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Jane Smith'));

      await repository.save(order1);
      await repository.save(order2);

      const result = await repository.findAll({ customerName: 'john' });

      expect(result).toHaveLength(1);
      expect(result[0].getCustomerInfo().getName()).toBe('John Doe');
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      await repository.save(order);

      const result = await repository.findAll({
        fromDate: yesterday,
        toDate: tomorrow,
      });

      expect(result).toHaveLength(1);
    });

    it('should apply pagination', async () => {
      for (let i = 0; i < 5; i++) {
        const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo(`Customer ${i}`));
        await repository.save(order);
      }

      const result = await repository.findAll({ limit: 2, offset: 1 });

      expect(result).toHaveLength(2);
    });

    it('should sort by createdAt descending by default', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('First'));
      await repository.save(order1);

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Second'));
      await repository.save(order2);

      const result = await repository.findAll();

      expect(result[0].getCustomerInfo().getName()).toBe('Second');
      expect(result[1].getCustomerInfo().getName()).toBe('First');
    });

    it('should sort by createdAt ascending when specified', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('First'));
      await repository.save(order1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Second'));
      await repository.save(order2);

      const result = await repository.findAll({ sortOrder: 'asc' });

      expect(result[0].getCustomerInfo().getName()).toBe('First');
      expect(result[1].getCustomerInfo().getName()).toBe('Second');
    });

    it('should sort by updatedAt descending', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('First'));
      await repository.save(order1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Second'));
      await repository.save(order2);

      const result = await repository.findAll({ sortBy: 'updatedAt', sortOrder: 'desc' });

      expect(result).toHaveLength(2);
    });

    it('should sort by updatedAt ascending', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('First'));
      await repository.save(order1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Second'));
      await repository.save(order2);

      const result = await repository.findAll({ sortBy: 'updatedAt', sortOrder: 'asc' });

      expect(result).toHaveLength(2);
    });
  });

  describe('count', () => {
    it('should count all orders', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Customer 2'));

      await repository.save(order1);
      await repository.save(order2);

      const count = await repository.count();

      expect(count).toBe(2);
    });

    it('should count with filters', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('John'));
      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Jane'));

      await repository.save(order1);
      await repository.save(order2);

      const count = await repository.count({ customerName: 'john' });

      expect(count).toBe(1);
    });
  });

  describe('update', () => {
    it('should update existing order', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      await repository.save(order);

      order.markAsPreparing();
      await repository.update(order);

      const found = await repository.findById(order.getId());
      expect(found?.getStatus().getValue()).toBe(OrderStatusEnum.PREPARING);
    });
  });

  describe('delete', () => {
    it('should delete order', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      await repository.save(order);

      await repository.delete(order.getId());

      const found = await repository.findById(order.getId());
      expect(found).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true when order exists', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      await repository.save(order);

      const result = await repository.exists(order.getId());

      expect(result).toBe(true);
    });

    it('should return false when order does not exist', async () => {
      const result = await repository.exists(new OrderId('ORD-9999-NOTFOUND'));

      expect(result).toBe(false);
    });
  });

  describe('helper methods', () => {
    it('should clear all orders', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      await repository.save(order);

      repository.clear();

      expect(repository.size()).toBe(0);
    });

    it('should return correct size', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Customer 2'));

      await repository.save(order1);
      await repository.save(order2);

      expect(repository.size()).toBe(2);
    });
  });
});
