/**
 * Dependency Injection Container
 * Configures and provides all dependencies for the application
 */
import { PrismaClient } from '@prisma/client';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { StatusHistoryRepository } from '../../domain/repositories/StatusHistoryRepository';
import { EventPublisher } from '../../application/ports/out/EventPublisher';
import { PrismaOrderRepository } from '../adapters/persistence/PrismaOrderRepository';
import { PrismaStatusHistoryRepository } from '../adapters/persistence/PrismaStatusHistoryRepository';
import { CachedOrderRepository } from '../adapters/persistence/CachedOrderRepository';
import { InMemoryOrderRepository } from '../adapters/persistence/InMemoryOrderRepository';
import { MetricsOrderRepository } from '../adapters/persistence/MetricsOrderRepository';
import { RedisStreamEventPublisher } from '../adapters/messaging/RedisStreamEventPublisher';
import { RedisClient } from '../adapters/cache/RedisClient';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { GetOrderStatusUseCase } from '../../application/use-cases/GetOrderStatusUseCase';
import { ListOrdersUseCase } from '../../application/use-cases/ListOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/UpdateOrderStatusUseCase';
import { UpdateOrderItemStatusUseCase } from '../../application/use-cases/UpdateOrderItemStatusUseCase';

export interface Dependencies {
  orderRepository: OrderRepository;
  statusHistoryRepository: StatusHistoryRepository;
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
    let statusHistoryRepository: StatusHistoryRepository;

    if (isTest) {
      // Use in-memory repository for tests (no external dependencies)
      orderRepository = new InMemoryOrderRepository();
      // For tests, we'll use a mock or skip history (statusHistoryRepository will be undefined for now)
      statusHistoryRepository = undefined as any;
    } else {
      const prismaClient = new PrismaClient({
        log: isProd ? ['error'] : ['query', 'error', 'warn'],
      });
      const baseRepository = new PrismaOrderRepository(prismaClient);
      statusHistoryRepository = new PrismaStatusHistoryRepository(prismaClient);

      // Wrap with cache if Redis is configured
      if (RedisClient.isConfigured()) {
        const cachedRepository = new CachedOrderRepository(baseRepository);
        orderRepository = new MetricsOrderRepository(cachedRepository);
        console.log('✅ Repository: Prisma + Redis Cache + Metrics');
      } else {
        orderRepository = new MetricsOrderRepository(baseRepository);
        console.log('⚠️  Repository: Prisma + Metrics (Redis not configured)');
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
      eventPublisher,
      statusHistoryRepository
    );
    const getOrderStatusUseCase = new GetOrderStatusUseCase(orderRepository);
    const listOrdersUseCase = new ListOrdersUseCase(orderRepository);
    const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(
      orderRepository,
      eventPublisher
    );
    const updateOrderItemStatusUseCase = new UpdateOrderItemStatusUseCase(
      orderRepository,
      eventPublisher,
      statusHistoryRepository
    );

    this.dependencies = {
      orderRepository,
      statusHistoryRepository,
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