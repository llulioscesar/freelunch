// Mock all external dependencies before imports
const mockPrisma = {
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
};

const mockPool = {
  end: jest.fn(),
};

const mockRedis = {
  ping: jest.fn(),
};

jest.mock('../../../../../src/generated/prisma/client/index.js', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn(),
}));

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockPool),
}));

jest.mock('../../../../../src/infrastructure/adapters/cache/RedisClient.js', () => ({
  RedisClient: {
    isConfigured: jest.fn(),
    getInstance: jest.fn().mockReturnValue(mockRedis),
  },
}));

import { SystemHealthChecker } from '../../../../../src/infrastructure/adapters/health/SystemHealthChecker';
import { RedisClient } from '../../../../../src/infrastructure/adapters/cache/RedisClient';

describe('SystemHealthChecker', () => {
  let healthChecker: SystemHealthChecker;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
    (RedisClient.isConfigured as jest.Mock).mockReturnValue(true);
    healthChecker = new SystemHealthChecker();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('checkDatabase', () => {
    it('should return up status when database is healthy', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await healthChecker.checkDatabase();

      expect(result.status).toBe('up');
      expect(result.message).toBe('Database connection healthy');
      expect(result.details?.provider).toBe('PostgreSQL');
    });

    it('should return degraded status when database is slow', async () => {
      mockPrisma.$queryRaw.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        return [{ '?column?': 1 }];
      });

      const result = await healthChecker.checkDatabase();

      expect(result.status).toBe('degraded');
      expect(result.message).toBe('Database responding slowly');
    });

    it('should return down status when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await healthChecker.checkDatabase();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Database connection failed');
      expect(result.details?.error).toBe('Connection refused');
    });
  });

  describe('checkEventPublisher', () => {
    it('should return up status when Redis is healthy', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await healthChecker.checkEventPublisher();

      expect(result.status).toBe('up');
      expect(result.message).toBe('Redis Streams ready for events');
      expect(result.details?.configured).toBe(true);
    });

    it('should return degraded status when Redis is not configured', async () => {
      (RedisClient.isConfigured as jest.Mock).mockReturnValue(false);
      const checker = new SystemHealthChecker();

      const result = await checker.checkEventPublisher();

      expect(result.status).toBe('degraded');
      expect(result.message).toBe('Redis not configured (events disabled)');
      expect(result.details?.configured).toBe(false);
    });

    it('should return down status when Redis ping fails', async () => {
      mockRedis.ping.mockResolvedValue('ERROR');

      const result = await healthChecker.checkEventPublisher();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Redis not responding');
    });

    it('should return down status when Redis throws error', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection timeout'));

      const result = await healthChecker.checkEventPublisher();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Redis connection failed');
      expect(result.details?.error).toBe('Connection timeout');
    });
  });

  describe('checkConfiguration', () => {
    it('should return up status when all config is present', async () => {
      process.env.DATABASE_URL = 'postgres://test';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      (RedisClient.isConfigured as jest.Mock).mockReturnValue(true);

      const result = await healthChecker.checkConfiguration();

      expect(result.status).toBe('up');
      expect(result.message).toBe('All configuration present');
    });

    it('should return down status when required config is missing', async () => {
      process.env.DATABASE_URL = '';

      const result = await healthChecker.checkConfiguration();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Missing required configuration');
      expect(result.details?.missingRequired).toContain('DATABASE_URL');
    });

    it('should return degraded status when optional config is missing', async () => {
      process.env.DATABASE_URL = 'postgres://test';
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';

      const result = await healthChecker.checkConfiguration();

      expect(result.status).toBe('degraded');
      expect(result.message).toBe('Some optional configuration missing');
    });
  });

  describe('close', () => {
    it('should disconnect prisma and close pool', async () => {
      await healthChecker.close();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
