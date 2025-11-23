/**
 * Unit Tests: RedisClient (with mocks)
 */
import { RedisClient } from '../../../../../src/infrastructure/adapters/cache/RedisClient';

// Mock Upstash Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  flushdb: jest.fn(),
  ping: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

describe('RedisClient (Unit with Mocks)', () => {
  let client: RedisClient;

  beforeAll(() => {
    // Mock environment variables
    process.env.REDIS_URL = 'redis://mock:6379';
    process.env.REDIS_TOKEN = 'mock-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    client = RedisClient.getInstance();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      mockRedis.get.mockResolvedValue('{"data":"test"}');

      const result = await client.get('test-key');

      expect(result).toEqual('{"data":"test"}');
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await client.get('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await client.set('test-key', '{"data":"test"}', { ex: 60 });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        '{"data":"test"}',
        { ex: 60 }
      );
    });

    it('should set value without expiration', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await client.set('test-key', '{"data":"test"}');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        '{"data":"test"}'
      );
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      mockRedis.del.mockResolvedValue(1);

      await client.del('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await client.exists('test-key');

      expect(result).toBe(1);
      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
    });

    it('should return 0 for non-existent key', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await client.exists('non-existent');

      expect(result).toBe(0);
    });
  });

  describe('keys', () => {
    it('should get keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2']);

      const result = await client.keys('test-*');

      expect(result).toEqual(['key1', 'key2']);
      expect(mockRedis.keys).toHaveBeenCalledWith('test-*');
    });
  });

  describe('ping', () => {
    it('should check connection', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await client.ping();

      expect(result).toBe('PONG');
      expect(mockRedis.ping).toHaveBeenCalled();
    });
  });

  describe('resetInstance', () => {
    it('should reset the singleton instance', () => {
      const instance1 = RedisClient.getInstance();
      RedisClient.resetInstance();

      // After reset, getInstance should create a new instance
      const instance2 = RedisClient.getInstance();

      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
    });
  });

  describe('isConfigured', () => {
    it('should return true when Redis is configured', () => {
      process.env.REDIS_URL = 'redis://mock:6379';
      process.env.REDIS_TOKEN = 'mock-token';

      const result = RedisClient.isConfigured();

      expect(result).toBe(true);
    });

    it('should return false when REDIS_URL is missing', () => {
      const originalUrl = process.env.REDIS_URL;
      delete process.env.REDIS_URL;

      const result = RedisClient.isConfigured();

      expect(result).toBe(false);

      // Restore
      process.env.REDIS_URL = originalUrl;
    });

    it('should return false when REDIS_TOKEN is missing', () => {
      const originalToken = process.env.REDIS_TOKEN;
      delete process.env.REDIS_TOKEN;

      const result = RedisClient.isConfigured();

      expect(result).toBe(false);

      // Restore
      process.env.REDIS_TOKEN = originalToken;
    });

    it('should check UPSTASH_REDIS_REST_URL as fallback', () => {
      const originalUrl = process.env.REDIS_URL;
      delete process.env.REDIS_URL;
      process.env.UPSTASH_REDIS_REST_URL = 'redis://upstash:6379';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';

      const result = RedisClient.isConfigured();

      expect(result).toBe(true);

      // Restore
      process.env.REDIS_URL = originalUrl;
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });
  });
});
