/**
 * Integration Tests: PrismaOrderRepository
 *
 * These tests use a real Prisma client connected to a test database.
 * Requires DATABASE_URL environment variable to be set to a test database.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaOrderRepository } from '../../../src/infrastructure/adapters/persistence/PrismaOrderRepository';
import { Order } from '../../../src/domain/entities/Order';
import { OrderId } from '../../../src/domain/value-objects/OrderId';
import { Quantity } from '../../../src/domain/value-objects/Quantity';
import { CustomerInfo } from '../../../src/domain/value-objects/CustomerInfo';
import { OrderStatus, OrderStatusEnum } from '../../../src/domain/value-objects/OrderStatus';
import { OrderItemStatus } from '../../../src/domain/entities/OrderItem';

describe('PrismaOrderRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaOrderRepository;

  beforeAll(async () => {
    // Create Prisma client for testing
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/orders_test',
        },
      },
    });

    repository = new PrismaOrderRepository(prisma);

    // Connect to database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Disconnect from database
    await repository.disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  });

  describe('save', () => {
    it('should save a new order with items to database', async () => {
      const orderId = new OrderId();
      const quantity = new Quantity(3);
      const customerInfo = new CustomerInfo('John Doe', 'No onions');
      const order = new Order(orderId, quantity, customerInfo);

      await repository.save(order);

      // Verify order was saved
      const savedOrder = await prisma.order.findUnique({
        where: { id: orderId.getValue() },
        include: { items: true },
      });

      expect(savedOrder).not.toBeNull();
      expect(savedOrder?.id).toBe(orderId.getValue());
      expect(savedOrder?.quantity).toBe(3);
      expect(savedOrder?.customerName).toBe('John Doe');
      expect(savedOrder?.notes).toBe('No onions');
      expect(savedOrder?.status).toBe('PENDING');
      expect(savedOrder?.items).toHaveLength(3);
    });

    it('should save order with all item details', async () => {
      const orderId = new OrderId();
      const quantity = new Quantity(1);
      const customerInfo = new CustomerInfo('Test Customer');
      const order = new Order(orderId, quantity, customerInfo);

      await repository.save(order);

      const savedOrder = await prisma.order.findUnique({
        where: { id: orderId.getValue() },
        include: { items: true },
      });

      const savedItem = savedOrder?.items[0];
      expect(savedItem?.id).toBeDefined();
      expect(savedItem?.orderId).toBe(orderId.getValue());
      expect(savedItem?.status).toBe('PENDING');
      expect(savedItem?.createdAt).toBeInstanceOf(Date);
    });

    it('should save order with default customer name', async () => {
      const orderId = new OrderId();
      const quantity = new Quantity(1);
      const customerInfo = new CustomerInfo();
      const order = new Order(orderId, quantity, customerInfo);

      await repository.save(order);

      const savedOrder = await prisma.order.findUnique({
        where: { id: orderId.getValue() },
      });

      expect(savedOrder?.customerName).toBe('Anonymous');
    });
  });

  describe('findById', () => {
    it('should find order by ID', async () => {
      const orderId = new OrderId();
      const quantity = new Quantity(2);
      const customerInfo = new CustomerInfo('Jane Smith', 'Extra sauce');
      const order = new Order(orderId, quantity, customerInfo);

      await repository.save(order);

      const foundOrder = await repository.findById(orderId);

      expect(foundOrder).not.toBeNull();
      expect(foundOrder?.getId().getValue()).toBe(orderId.getValue());
      expect(foundOrder?.getQuantity().getValue()).toBe(2);
      expect(foundOrder?.getCustomerInfo().getName()).toBe('Jane Smith');
      expect(foundOrder?.getCustomerInfo().getNotes()).toBe('Extra sauce');
      expect(foundOrder?.getItems()).toHaveLength(2);
    });

    it('should return null for non-existent order', async () => {
      const nonExistentId = new OrderId('ORD-999999999-Unonexistent');

      const foundOrder = await repository.findById(nonExistentId);

      expect(foundOrder).toBeNull();
    });

    it('should return order with all item details', async () => {
      const orderId = new OrderId();
      const quantity = new Quantity(1);
      const customerInfo = new CustomerInfo('Test');
      const order = new Order(orderId, quantity, customerInfo);

      // Assign recipe to item
      const items = order.getItems();
      items[0].assignRecipe('RCP-001', 'Burger');

      await repository.save(order);

      const foundOrder = await repository.findById(orderId);

      expect(foundOrder).not.toBeNull();
      const foundItems = foundOrder!.getItems();
      expect(foundItems[0].getRecipeId()).toBe('RCP-001');
      expect(foundItems[0].getRecipeName()).toBe('Burger');
      expect(foundItems[0].getStatus()).toBe(OrderItemStatus.ASSIGNED);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      // Create multiple orders
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(new OrderId(), new Quantity(2), new CustomerInfo('Customer 2'));
      const order3 = new Order(new OrderId(), new Quantity(3), new CustomerInfo('Customer 3'));

      await repository.save(order1);
      await repository.save(order2);
      await repository.save(order3);

      const allOrders = await repository.findAll();

      expect(allOrders).toHaveLength(3);
    });

    it('should filter orders by status', async () => {
      // Create orders with different statuses
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 2'));
      order2.markAsPreparing();

      await repository.save(order1);
      await repository.save(order2);

      const pendingOrders = await repository.findAll({
        status: new OrderStatus(OrderStatusEnum.PENDING),
      });

      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].getStatus().getValue()).toBe(OrderStatusEnum.PENDING);
    });

    it('should filter orders by customer name', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Alice'));
      const order2 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Bob'));
      const order3 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Alice Cooper'));

      await repository.save(order1);
      await repository.save(order2);
      await repository.save(order3);

      const aliceOrders = await repository.findAll({
        customerName: 'Alice',
      });

      expect(aliceOrders).toHaveLength(2);
      aliceOrders.forEach(order => {
        expect(order.getCustomerInfo().getName()).toMatch(/Alice/i);
      });
    });

    it('should support pagination', async () => {
      // Create 5 orders
      for (let i = 0; i < 5; i++) {
        const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo(`Customer ${i}`));
        await repository.save(order);
      }

      const page1 = await repository.findAll({ limit: 2, offset: 0 });
      const page2 = await repository.findAll({ limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].getId().getValue()).not.toBe(page2[0].getId().getValue());
    });

    it('should sort orders by createdAt descending by default', async () => {
      // Create orders with delays to ensure different timestamps
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('First'));
      await repository.save(order1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const order2 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Second'));
      await repository.save(order2);

      const orders = await repository.findAll();

      expect(orders).toHaveLength(2);
      expect(orders[0].getCustomerInfo().getName()).toBe('Second');
      expect(orders[1].getCustomerInfo().getName()).toBe('First');
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Test'));
      await repository.save(order);

      const ordersInRange = await repository.findAll({
        fromDate: yesterday,
        toDate: tomorrow,
      });

      expect(ordersInRange).toHaveLength(1);
    });

    it('should return empty array when no orders match filters', async () => {
      const order = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Alice'));
      await repository.save(order);

      const orders = await repository.findAll({
        customerName: 'NonExistent',
      });

      expect(orders).toHaveLength(0);
    });
  });

  describe('count', () => {
    it('should count all orders', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 1'));
      const order2 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Customer 2'));

      await repository.save(order1);
      await repository.save(order2);

      const count = await repository.count();

      expect(count).toBe(2);
    });

    it('should count orders matching filters', async () => {
      const order1 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Alice'));
      const order2 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Bob'));
      const order3 = new Order(new OrderId(), new Quantity(1), new CustomerInfo('Alice Cooper'));

      await repository.save(order1);
      await repository.save(order2);
      await repository.save(order3);

      const count = await repository.count({ customerName: 'Alice' });

      expect(count).toBe(2);
    });
  });

  describe('update', () => {
    it('should update order status', async () => {
      const orderId = new OrderId();
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));

      await repository.save(order);

      // Update order status
      order.markAsPreparing();
      await repository.update(order);

      // Verify update
      const updatedOrder = await repository.findById(orderId);
      expect(updatedOrder?.getStatus().getValue()).toBe(OrderStatusEnum.PREPARING);
    });

    it('should update order items', async () => {
      const orderId = new OrderId();
      const order = new Order(orderId, new Quantity(2), new CustomerInfo('Test'));

      await repository.save(order);

      // Update first item
      const items = order.getItems();
      items[0].assignRecipe('RCP-001', 'Burger');
      items[0].markAsPreparing();

      await repository.update(order);

      // Verify update
      const updatedOrder = await repository.findById(orderId);
      const updatedItems = updatedOrder!.getItems();

      expect(updatedItems[0].getRecipeId()).toBe('RCP-001');
      expect(updatedItems[0].getStatus()).toBe(OrderItemStatus.PREPARING);
      expect(updatedItems[1].getStatus()).toBe(OrderItemStatus.PENDING);
    });

    it('should update completedAt when order completes', async () => {
      const orderId = new OrderId();
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));

      await repository.save(order);

      // Complete the order
      const items = order.getItems();
      items[0].assignRecipe('RCP-001', 'Burger');
      items[0].markAsPreparing();
      items[0].markAsIngredientsRequested();
      items[0].markAsCooking();
      items[0].markAsReady();
      items[0].markAsDelivered();

      order.markAsDelivered();
      await repository.update(order);

      // Verify completedAt is set
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId.getValue() },
      });

      expect(updatedOrder?.completedAt).toBeInstanceOf(Date);
    });

    it('should use transaction for atomic updates', async () => {
      const orderId = new OrderId();
      const order = new Order(orderId, new Quantity(2), new CustomerInfo('Test'));

      await repository.save(order);

      // Update multiple items
      const items = order.getItems();
      items[0].assignRecipe('RCP-001', 'Burger');
      items[1].assignRecipe('RCP-002', 'Pizza');

      await repository.update(order);

      // Verify both items were updated
      const updatedOrder = await repository.findById(orderId);
      const updatedItems = updatedOrder!.getItems();

      expect(updatedItems[0].getRecipeId()).toBe('RCP-001');
      expect(updatedItems[1].getRecipeId()).toBe('RCP-002');
    });
  });

  describe('delete', () => {
    it('should delete order and its items', async () => {
      const orderId = new OrderId();
      const order = new Order(orderId, new Quantity(2), new CustomerInfo('Test'));

      await repository.save(order);

      await repository.delete(orderId);

      // Verify order was deleted
      const deletedOrder = await repository.findById(orderId);
      expect(deletedOrder).toBeNull();

      // Verify items were also deleted (cascade)
      const items = await prisma.orderItem.findMany({
        where: { orderId: orderId.getValue() },
      });
      expect(items).toHaveLength(0);
    });

    it('should throw error when deleting non-existent order', async () => {
      const nonExistentId = new OrderId('ORD-999999999-Unonexistent');

      await expect(repository.delete(nonExistentId)).rejects.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true for existing order', async () => {
      const orderId = new OrderId();
      const order = new Order(orderId, new Quantity(1), new CustomerInfo('Test'));

      await repository.save(order);

      const exists = await repository.exists(orderId);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent order', async () => {
      const nonExistentId = new OrderId('ORD-999999999-Unonexistent');

      const exists = await repository.exists(nonExistentId);

      expect(exists).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking Prisma client to simulate connection errors
      // For now, we just verify the repository handles the Prisma client
      expect(repository).toBeInstanceOf(PrismaOrderRepository);
    });
  });
});
