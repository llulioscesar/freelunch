/**
 * Dependency Injection Container
 * Configures and provides all dependencies for the application
 */
import { PrismaClient } from '@prisma/client';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { EventPublisher } from '../../application/ports/out/EventPublisher';
import { PrismaOrderRepository } from '../adapters/persistence/PrismaOrderRepository';
import { CachedOrderRepository } from '../adapters/persistence/CachedOrderRepository';
import { InMemoryOrderRepository } from '../adapters/persistence/InMemoryOrderRepository';
import { RedisStreamEventPublisher } from '../adapters/messaging/RedisStreamEventPublisher';
import { RedisClient } from '../cache/RedisClient';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { GetOrderStatusUseCase } from '../../application/use-cases/GetOrderStatusUseCase';
import { ListOrdersUseCase } from '../../application/use-cases/ListOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/UpdateOrderStatusUseCase';
import { UpdateOrderItemStatusUseCase } from '../../application/use-cases/UpdateOrderItemStatusUseCase';

export interface Dependencies {
  orderRepository: OrderRepository;
  eventPublisher: EventPublisher;
  createOrderUseCase: CreateOrderUseCase;
  getOrderStatusUseCase: GetOrderStatusUseCase;
  listOrdersUseCase: ListOrdersUseCase;
  updateOrderStatusUseCase: UpdateOrderStatusUseCase;
  updateOrderItemStatusUseCase: UpdateOrderItemStatusUseCase;
}

export class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Dependencies;

  private constructor() {
    // Initialize dependencies based on environment
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    // Repository with Redis caching
    let orderRepository: OrderRepository;
    if (isTest) {
      // Use in-memory repository for tests (no external dependencies)
      orderRepository = new InMemoryOrderRepository();
    } else {
      const prismaClient = new PrismaClient({
        log: isProd ? ['error'] : ['query', 'error', 'warn'],
      });
      const baseRepository = new PrismaOrderRepository(prismaClient);

      // Wrap with cache if Redis is configured
      if (RedisClient.isConfigured()) {
        orderRepository = new CachedOrderRepository(baseRepository);
        console.log('✅ Repository: Prisma + Redis Cache');
      } else {
        orderRepository = baseRepository;
        console.log('⚠️  Repository: Prisma only (Redis not configured)');
      }
    }

    // Event Publisher with Redis Streams
    let eventPublisher: EventPublisher;
    if (isTest || !RedisClient.isConfigured()) {
      // Fallback to no-op or in-memory for tests
      eventPublisher = new RedisStreamEventPublisher(); // Will throw if not configured
      console.log('⚠️  Event Publisher: Redis Streams (may fail if not configured)');
    } else {
      eventPublisher = new RedisStreamEventPublisher();
      console.log('✅ Event Publisher: Redis Streams');
    }

    // Use Cases
    const createOrderUseCase = new CreateOrderUseCase(
      orderRepository,
      eventPublisher
    );
    const getOrderStatusUseCase = new GetOrderStatusUseCase(orderRepository);
    const listOrdersUseCase = new ListOrdersUseCase(orderRepository);
    const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(
      orderRepository,
      eventPublisher
    );
    const updateOrderItemStatusUseCase = new UpdateOrderItemStatusUseCase(
      orderRepository,
      eventPublisher
    );

    this.dependencies = {
      orderRepository,
      eventPublisher,
      createOrderUseCase,
      getOrderStatusUseCase,
      listOrdersUseCase,
      updateOrderStatusUseCase,
      updateOrderItemStatusUseCase,
    };
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  getDependencies(): Dependencies {
    return this.dependencies;
  }

  // For testing purposes
  static reset(): void {
    DependencyContainer.instance = undefined as any;
  }
}

// Export singleton instance
export const container = DependencyContainer.getInstance();
export const dependencies = container.getDependencies();