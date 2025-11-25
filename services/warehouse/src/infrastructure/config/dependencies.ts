/**
 * Dependency Injection Container
 * Warehouse Service
 *
 * Configures and provides all dependencies for the application
 */
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { PurchaseRepository } from '../../domain/repositories/PurchaseRepository';
import { EventPublisher } from '../../application/ports/out/EventPublisher';
import { MarketClient } from '../../application/ports/out/MarketClient';
import { KitchenClient } from '../../application/ports/out/KitchenClient';
import { PrismaInventoryRepository } from '../adapters/persistence/PrismaInventoryRepository';
import { PrismaPurchaseRepository } from '../adapters/persistence/PrismaPurchaseRepository';
import { RedisStreamEventPublisher } from '../adapters/messaging/RedisStreamEventPublisher';
import { HttpMarketClient } from '../adapters/http/HttpMarketClient';
import { RedisKitchenClient } from '../adapters/messaging/RedisKitchenClient';
import { ProcessIngredientRequestUseCase } from '../../application/use-cases/ProcessIngredientRequestUseCase';
import { GetInventoryUseCase } from '../../application/use-cases/GetInventoryUseCase';
import { GetPurchaseHistoryUseCase } from '../../application/use-cases/GetPurchaseHistoryUseCase';
import { InitializeInventoryUseCase } from '../../application/use-cases/InitializeInventoryUseCase';
import { KitchenRequestsConsumer } from '../consumers/KitchenRequestsConsumer';

export interface Dependencies {
  // Repositories
  inventoryRepository: InventoryRepository;
  purchaseRepository: PurchaseRepository;

  // Ports
  eventPublisher: EventPublisher;
  marketClient: MarketClient;
  kitchenClient: KitchenClient;

  // Use Cases
  processIngredientRequestUseCase: ProcessIngredientRequestUseCase;
  getInventoryUseCase: GetInventoryUseCase;
  getPurchaseHistoryUseCase: GetPurchaseHistoryUseCase;
  initializeInventoryUseCase: InitializeInventoryUseCase;

  // Consumers
  kitchenRequestsConsumer: KitchenRequestsConsumer;
}

export class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Dependencies;

  private constructor() {
    // Repositories
    const inventoryRepository: InventoryRepository = new PrismaInventoryRepository();
    const purchaseRepository: PurchaseRepository = new PrismaPurchaseRepository();

    // Event Publisher
    const eventPublisher: EventPublisher = new RedisStreamEventPublisher();

    // External Clients
    const marketClient: MarketClient = new HttpMarketClient();
    const kitchenClient: KitchenClient = new RedisKitchenClient();

    // Use Cases
    const processIngredientRequestUseCase = new ProcessIngredientRequestUseCase(
      inventoryRepository,
      purchaseRepository,
      marketClient,
      kitchenClient
    );

    const getInventoryUseCase = new GetInventoryUseCase(inventoryRepository);

    const getPurchaseHistoryUseCase = new GetPurchaseHistoryUseCase(purchaseRepository);

    const initializeInventoryUseCase = new InitializeInventoryUseCase(inventoryRepository);

    // Consumers
    const kitchenRequestsConsumer = new KitchenRequestsConsumer(
      processIngredientRequestUseCase
    );

    this.dependencies = {
      inventoryRepository,
      purchaseRepository,
      eventPublisher,
      marketClient,
      kitchenClient,
      processIngredientRequestUseCase,
      getInventoryUseCase,
      getPurchaseHistoryUseCase,
      initializeInventoryUseCase,
      kitchenRequestsConsumer,
    };

    console.log('Warehouse Service dependencies initialized');
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
