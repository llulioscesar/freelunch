/**
 * Dependency Injection Container
 * Configures and provides all dependencies for the application
 */
import { PrismaClient } from '@prisma/client';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { EventPublisher } from '../../application/ports/out/EventPublisher';
import { PrismaOrderRepository } from '../adapters/persistence/PrismaOrderRepository';
import { InMemoryOrderRepository } from '../adapters/persistence/InMemoryOrderRepository';
import { QStashEventPublisher } from '../adapters/messaging/QStashEventPublisher';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { GetOrderStatusUseCase } from '../../application/use-cases/GetOrderStatusUseCase';
import { ListOrdersUseCase } from '../../application/use-cases/ListOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/UpdateOrderStatusUseCase';

export interface Dependencies {
  orderRepository: OrderRepository;
  eventPublisher: EventPublisher;
  createOrderUseCase: CreateOrderUseCase;
  getOrderStatusUseCase: GetOrderStatusUseCase;
  listOrdersUseCase: ListOrdersUseCase;
  updateOrderStatusUseCase: UpdateOrderStatusUseCase;
}

export class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Dependencies;

  private constructor() {
    // Initialize dependencies based on environment
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    // Repository
    let orderRepository: OrderRepository;
    if (isTest) {
      orderRepository = new InMemoryOrderRepository();
    } else {
      const prismaClient = new PrismaClient({
        log: isProd ? ['error'] : ['query', 'error', 'warn'],
      });
      orderRepository = new PrismaOrderRepository(prismaClient);
    }

    // Event Publisher
    const eventPublisher = new QStashEventPublisher();

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

    this.dependencies = {
      orderRepository,
      eventPublisher,
      createOrderUseCase,
      getOrderStatusUseCase,
      listOrdersUseCase,
      updateOrderStatusUseCase,
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