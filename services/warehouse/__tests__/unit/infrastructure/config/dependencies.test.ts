// Mock all adapters and repositories before importing
jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaInventoryRepository', () => ({
  PrismaInventoryRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
    save: jest.fn(),
    findByIngredientName: jest.fn(),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaPurchaseRepository', () => ({
  PrismaPurchaseRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
    save: jest.fn(),
    findRecent: jest.fn(),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/messaging/RedisStreamEventPublisher', () => ({
  RedisStreamEventPublisher: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    publishAll: jest.fn(),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/http/HttpMarketClient', () => ({
  HttpMarketClient: jest.fn().mockImplementation(() => ({
    buyIngredient: jest.fn(),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/messaging/RedisKitchenClient', () => ({
  RedisKitchenClient: jest.fn().mockImplementation(() => ({
    notifyIngredientsReserved: jest.fn(),
    notifyIngredientsUnavailable: jest.fn(),
  })),
}));

jest.mock('../../../../src/infrastructure/adapters/cache/RedisClient', () => ({
  RedisClient: {
    getInstance: jest.fn().mockReturnValue({
      xgroup: jest.fn(),
      xreadgroup: jest.fn(),
    }),
  },
}));

describe('DependencyContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset modules to get fresh singleton
    jest.resetModules();
  });

  describe('getInstance', () => {
    it('should create container instance', async () => {
      const { DependencyContainer } = await import(
        '../../../../src/infrastructure/config/dependencies'
      );

      // Reset the container first
      DependencyContainer.reset();

      const instance = DependencyContainer.getInstance();

      expect(instance).toBeDefined();
    });

    it('should return same instance on subsequent calls (singleton)', async () => {
      const { DependencyContainer } = await import(
        '../../../../src/infrastructure/config/dependencies'
      );

      DependencyContainer.reset();

      const instance1 = DependencyContainer.getInstance();
      const instance2 = DependencyContainer.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getDependencies', () => {
    it('should return all dependencies', async () => {
      const { DependencyContainer } = await import(
        '../../../../src/infrastructure/config/dependencies'
      );

      DependencyContainer.reset();
      const container = DependencyContainer.getInstance();
      const deps = container.getDependencies();

      // Repositories
      expect(deps.inventoryRepository).toBeDefined();
      expect(deps.purchaseRepository).toBeDefined();

      // Ports
      expect(deps.eventPublisher).toBeDefined();
      expect(deps.marketClient).toBeDefined();
      expect(deps.kitchenClient).toBeDefined();

      // Use Cases
      expect(deps.processIngredientRequestUseCase).toBeDefined();
      expect(deps.getInventoryUseCase).toBeDefined();
      expect(deps.getPurchaseHistoryUseCase).toBeDefined();
      expect(deps.initializeInventoryUseCase).toBeDefined();

      // Consumers
      expect(deps.kitchenRequestsConsumer).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset the singleton instance', async () => {
      const { DependencyContainer } = await import(
        '../../../../src/infrastructure/config/dependencies'
      );

      const instance1 = DependencyContainer.getInstance();
      DependencyContainer.reset();
      const instance2 = DependencyContainer.getInstance();

      // After reset, a new instance should be created
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('exported instances', () => {
    it('should export container instance', async () => {
      const { container } = await import(
        '../../../../src/infrastructure/config/dependencies'
      );

      expect(container).toBeDefined();
      expect(typeof container.getDependencies).toBe('function');
    });

    it('should export dependencies directly', async () => {
      // Reset modules to ensure fresh import
      jest.resetModules();

      // Re-apply mocks after reset
      jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaInventoryRepository', () => ({
        PrismaInventoryRepository: jest.fn().mockImplementation(() => ({})),
      }));
      jest.mock('../../../../src/infrastructure/adapters/persistence/PrismaPurchaseRepository', () => ({
        PrismaPurchaseRepository: jest.fn().mockImplementation(() => ({})),
      }));
      jest.mock('../../../../src/infrastructure/adapters/messaging/RedisStreamEventPublisher', () => ({
        RedisStreamEventPublisher: jest.fn().mockImplementation(() => ({})),
      }));
      jest.mock('../../../../src/infrastructure/adapters/http/HttpMarketClient', () => ({
        HttpMarketClient: jest.fn().mockImplementation(() => ({})),
      }));
      jest.mock('../../../../src/infrastructure/adapters/messaging/RedisKitchenClient', () => ({
        RedisKitchenClient: jest.fn().mockImplementation(() => ({})),
      }));
      jest.mock('../../../../src/infrastructure/adapters/cache/RedisClient', () => ({
        RedisClient: {
          getInstance: jest.fn().mockReturnValue({}),
        },
      }));

      const { dependencies } = await import(
        '../../../../src/infrastructure/config/dependencies'
      );

      expect(dependencies).toBeDefined();
      expect(dependencies.inventoryRepository).toBeDefined();
    });
  });
});
