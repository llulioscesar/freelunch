// Store original process handlers
const originalOn = process.on;
const registeredHandlers: Record<string, Function[]> = {};

// Mock process.on to capture signal handlers
process.on = jest.fn((event: string, handler: Function) => {
  if (!registeredHandlers[event]) {
    registeredHandlers[event] = [];
  }
  registeredHandlers[event].push(handler);
  return process;
}) as any;

// Mock the Prisma generated client
const mockPrismaInstance = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../../../../src/generated/prisma/client/index.js', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaInstance),
}));

// Mock Prisma adapter
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

// Mock pg Pool
const mockPoolInstance = {
  end: jest.fn().mockResolvedValue(undefined),
};

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockPoolInstance),
}));

// Mock logger
jest.mock('../../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PrismaClientSingleton', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module cache to get fresh singleton
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
    process.on = originalOn;
  });

  describe('getInstance', () => {
    it('should create Prisma client instance', async () => {
      // Re-require to get fresh instance
      const { PrismaClientSingleton } = await import(
        '../../../../../src/infrastructure/adapters/persistence/PrismaClient'
      );

      const instance = PrismaClientSingleton.getInstance();

      expect(instance).toBeDefined();
      expect(instance).toBe(mockPrismaInstance);
    });

    it('should return same instance on subsequent calls (singleton)', async () => {
      const { PrismaClientSingleton } = await import(
        '../../../../../src/infrastructure/adapters/persistence/PrismaClient'
      );

      const instance1 = PrismaClientSingleton.getInstance();
      const instance2 = PrismaClientSingleton.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should configure Pool with DATABASE_URL', async () => {
      const pg = require('pg');

      await import('../../../../../src/infrastructure/adapters/persistence/PrismaClient');

      expect(pg.Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: 'postgresql://test:test@localhost:5432/testdb',
        })
      );
    });

    it('should attempt to connect to database', async () => {
      await import('../../../../../src/infrastructure/adapters/persistence/PrismaClient');

      // Allow promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPrismaInstance.$connect).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect prisma and end pool', async () => {
      const { PrismaClientSingleton } = await import(
        '../../../../../src/infrastructure/adapters/persistence/PrismaClient'
      );

      // Ensure instance exists
      PrismaClientSingleton.getInstance();

      await PrismaClientSingleton.disconnect();

      expect(mockPrismaInstance.$disconnect).toHaveBeenCalled();
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });
  });

  describe('signal handlers', () => {
    it('should register SIGINT handler', async () => {
      await import('../../../../../src/infrastructure/adapters/persistence/PrismaClient');

      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should register SIGTERM handler', async () => {
      await import('../../../../../src/infrastructure/adapters/persistence/PrismaClient');

      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });
  });
});
