// Mock @upstash/redis before import
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

jest.mock('../../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

import { RedisClient } from '../../../../../src/infrastructure/adapters/cache/RedisClient';

describe('RedisClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    RedisClient.resetInstance();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should create Redis instance when env vars are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const instance = RedisClient.getInstance();

      expect(instance).toBeDefined();
    });

    it('should return same instance on multiple calls', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const instance1 = RedisClient.getInstance();
      const instance2 = RedisClient.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should throw error when UPSTASH_REDIS_REST_URL is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(() => RedisClient.getInstance()).toThrow(
        'Redis configuration missing'
      );
    });

    it('should throw error when UPSTASH_REDIS_REST_TOKEN is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';

      expect(() => RedisClient.getInstance()).toThrow(
        'Redis configuration missing'
      );
    });

    it('should throw error when both env vars are missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';

      expect(() => RedisClient.getInstance()).toThrow(
        'Redis configuration missing'
      );
    });
  });

  describe('resetInstance', () => {
    it('should reset the singleton instance', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      RedisClient.getInstance();
      RedisClient.resetInstance();

      // After reset, getInstance should create a new Redis instance
      // The mock always returns the same mock object, so we check that Redis constructor is called again
      const { Redis } = require('@upstash/redis');
      const callsBefore = Redis.mock.calls.length;

      RedisClient.getInstance();

      // Should have called Redis constructor again
      expect(Redis.mock.calls.length).toBe(callsBefore + 1);
    });
  });

  describe('isConfigured', () => {
    it('should return true when both env vars are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(RedisClient.isConfigured()).toBe(true);
    });

    it('should return false when UPSTASH_REDIS_REST_URL is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(RedisClient.isConfigured()).toBe(false);
    });

    it('should return false when UPSTASH_REDIS_REST_TOKEN is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';

      expect(RedisClient.isConfigured()).toBe(false);
    });

    it('should return false when both env vars are missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';

      expect(RedisClient.isConfigured()).toBe(false);
    });
  });
});
