/**
 * Dependency Injection Container
 * Kitchen Service
 *
 * Configures and provides all dependencies for the application
 */
import { prismaClient } from '../adapters/persistence/PrismaClient';
import { RecipeRepository } from '../../domain/repositories/RecipeRepository';
import { PlateRepository } from '../../domain/repositories/PlateRepository';
import { StatusHistoryRepository } from '../../domain/repositories/StatusHistoryRepository';
import { EventPublisher } from '../../application/ports/out/EventPublisher';
import { WarehouseClient } from '../../application/ports/out/WarehouseClient';
import { PrismaRecipeRepository } from '../adapters/persistence/PrismaRecipeRepository';
import { PrismaPlateRepository } from '../adapters/persistence/PrismaPlateRepository';
import { PrismaStatusHistoryRepository } from '../adapters/persistence/PrismaStatusHistoryRepository';
import { HistoryTrackingPlateRepository } from '../adapters/persistence/HistoryTrackingPlateRepository';
import { RedisStreamEventPublisher } from '../adapters/messaging/RedisStreamEventPublisher';
import { RedisWarehouseClient } from '../adapters/messaging/RedisWarehouseClient';
import { ProcessOrderUseCase } from '../../application/use-cases/ProcessOrderUseCase';
import { AssignRecipeUseCase } from '../../application/use-cases/AssignRecipeUseCase';
import { GetRecipesUseCase } from '../../application/use-cases/GetRecipesUseCase';
import { ListPlatesUseCase } from '../../application/use-cases/ListPlatesUseCase';
import { RequestIngredientsUseCase } from '../../application/use-cases/RequestIngredientsUseCase';
import { OrderEventsConsumer } from '../consumers/OrderEventsConsumer';
import { WarehouseResponsesConsumer } from '../consumers/WarehouseResponsesConsumer';

export interface Dependencies {
  // Repositories
  recipeRepository: RecipeRepository;
  plateRepository: PlateRepository;
  statusHistoryRepository: StatusHistoryRepository;

  // Ports
  eventPublisher: EventPublisher;
  warehouseClient: WarehouseClient;

  // Use Cases
  processOrderUseCase: ProcessOrderUseCase;
  assignRecipeUseCase: AssignRecipeUseCase;
  getRecipesUseCase: GetRecipesUseCase;
  listPlatesUseCase: ListPlatesUseCase;
  requestIngredientsUseCase: RequestIngredientsUseCase;

  // Consumers
  orderEventsConsumer: OrderEventsConsumer;
  warehouseResponsesConsumer: WarehouseResponsesConsumer;
}

export class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Dependencies;

  private constructor() {
    // Initialize dependencies based on environment
    // Reserved for future test-specific configuration
    void (process.env.NODE_ENV === 'test');

    // Repositories
    const recipeRepository: RecipeRepository = new PrismaRecipeRepository(prismaClient);
    const basePlateRepository: PlateRepository = new PrismaPlateRepository(prismaClient);
    const statusHistoryRepository: StatusHistoryRepository = new PrismaStatusHistoryRepository(prismaClient);

    // Wrap plate repository with history tracking
    const plateRepository: PlateRepository = new HistoryTrackingPlateRepository(
      basePlateRepository,
      statusHistoryRepository
    );

    // Event Publisher
    const eventPublisher: EventPublisher = new RedisStreamEventPublisher();

    // Warehouse Client
    const warehouseClient: WarehouseClient = new RedisWarehouseClient();

    // Use Cases
    const processOrderUseCase = new ProcessOrderUseCase(
      plateRepository,
      eventPublisher
    );

    const assignRecipeUseCase = new AssignRecipeUseCase(
      plateRepository,
      recipeRepository,
      eventPublisher,
      warehouseClient
    );

    const getRecipesUseCase = new GetRecipesUseCase(recipeRepository);

    const listPlatesUseCase = new ListPlatesUseCase(plateRepository);

    const requestIngredientsUseCase = new RequestIngredientsUseCase(
      plateRepository,
      warehouseClient,
      eventPublisher
    );

    // Consumers
    const orderEventsConsumer = new OrderEventsConsumer(
      processOrderUseCase,
      assignRecipeUseCase
    );

    const warehouseResponsesConsumer = new WarehouseResponsesConsumer(
      plateRepository,
      eventPublisher
    );

    this.dependencies = {
      recipeRepository,
      plateRepository,
      statusHistoryRepository,
      eventPublisher,
      warehouseClient,
      processOrderUseCase,
      assignRecipeUseCase,
      getRecipesUseCase,
      listPlatesUseCase,
      requestIngredientsUseCase,
      orderEventsConsumer,
      warehouseResponsesConsumer,
    };

    console.log('✅ Kitchen Service dependencies initialized');
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
