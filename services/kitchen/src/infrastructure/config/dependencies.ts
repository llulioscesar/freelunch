/**
 * Dependency Injection Container
 * Kitchen Service
 *
 * Configures and provides all dependencies for the application
 */
import { prismaClient } from '../adapters/persistence/PrismaClient.js';
import { RecipeRepository } from '../../domain/repositories/RecipeRepository.js';
import { PlateRepository } from '../../domain/repositories/PlateRepository.js';
import { EventPublisher } from '../../application/ports/out/EventPublisher.js';
import { WarehouseClient } from '../../application/ports/out/WarehouseClient.js';
import { PrismaRecipeRepository } from '../adapters/persistence/PrismaRecipeRepository.js';
import { PrismaPlateRepository } from '../adapters/persistence/PrismaPlateRepository.js';
import { RedisStreamEventPublisher } from '../adapters/messaging/RedisStreamEventPublisher.js';
import { RedisWarehouseClient } from '../adapters/messaging/RedisWarehouseClient.js';
import { ProcessOrderUseCase } from '../../application/use-cases/ProcessOrderUseCase.js';
import { AssignRecipeUseCase } from '../../application/use-cases/AssignRecipeUseCase.js';
import { GetRecipesUseCase } from '../../application/use-cases/GetRecipesUseCase.js';
import { ListPlatesUseCase } from '../../application/use-cases/ListPlatesUseCase.js';
import { RequestIngredientsUseCase } from '../../application/use-cases/RequestIngredientsUseCase.js';
import { OrderEventsConsumer } from '../consumers/OrderEventsConsumer.js';
import { WarehouseResponsesConsumer } from '../consumers/WarehouseResponsesConsumer.js';

export interface Dependencies {
  // Repositories
  recipeRepository: RecipeRepository;
  plateRepository: PlateRepository;

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
    const plateRepository: PlateRepository = new PrismaPlateRepository(prismaClient);

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
