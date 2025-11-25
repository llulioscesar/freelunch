// Mock @upstash/redis before importing
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
  })),
}));

// Mock logger
jest.mock('../../../../../src/infrastructure/logging/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { RedisClient } from '../../../../../src/infrastructure/adapters/cache/RedisClient';
import { Redis } from '@upstash/redis';

describe('RedisClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton between tests
    RedisClient.resetInstance();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should create Redis instance when environment variables are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const instance = RedisClient.getInstance();

      expect(instance).toBeDefined();
      expect(Redis).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://test-redis.upstash.io',
          token: 'test-token',
        })
      );
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const instance1 = RedisClient.getInstance();
      const instance2 = RedisClient.getInstance();

      expect(instance1).toBe(instance2);
      expect(Redis).toHaveBeenCalledTimes(1);
    });

    it('should throw error when UPSTASH_REDIS_REST_URL is missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(() => RedisClient.getInstance()).toThrow(
        'Redis configuration missing'
      );
    });

    it('should throw error when UPSTASH_REDIS_REST_TOKEN is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(() => RedisClient.getInstance()).toThrow(
        'Redis configuration missing'
      );
    });

    it('should throw error when both environment variables are missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(() => RedisClient.getInstance()).toThrow(
        'Redis configuration missing'
      );
    });
  });

  describe('resetInstance', () => {
    it('should reset the singleton instance', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const instance1 = RedisClient.getInstance();
      RedisClient.resetInstance();
      const instance2 = RedisClient.getInstance();

      expect(instance1).not.toBe(instance2);
      expect(Redis).toHaveBeenCalledTimes(2);
    });
  });

  describe('isConfigured', () => {
    it('should return true when both environment variables are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(RedisClient.isConfigured()).toBe(true);
    });

    it('should return false when URL is missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      expect(RedisClient.isConfigured()).toBe(false);
    });

    it('should return false when token is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(RedisClient.isConfigured()).toBe(false);
    });

    it('should return false when both are missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(RedisClient.isConfigured()).toBe(false);
    });
  });
});
