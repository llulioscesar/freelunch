/**
 * Additional tests for RedisClient branches
 */
import { RedisClient } from '../../../../../src/infrastructure/adapters/cache/RedisClient';

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

describe('RedisClient - Branch Coverage', () => {
  beforeAll(() => {
    process.env.REDIS_URL = 'redis://mock:6379';
    process.env.REDIS_TOKEN = 'mock-token';
  });

  afterEach(() => {
    RedisClient.resetInstance();
  });

  it('should use UPSTASH_REDIS_REST_URL when REDIS_URL not set', () => {
    delete process.env.REDIS_URL;
    process.env.UPSTASH_REDIS_REST_URL = 'redis://upstash:6379';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';

    const client = RedisClient.getInstance();

    expect(client).toBeDefined();

    // Restore
    process.env.REDIS_URL = 'redis://mock:6379';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should use UPSTASH_REDIS_REST_TOKEN when REDIS_TOKEN not set', () => {
    delete process.env.REDIS_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = 'redis://upstash:6379';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';

    const client = RedisClient.getInstance();

    expect(client).toBeDefined();

    // Restore
    process.env.REDIS_TOKEN = 'mock-token';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should throw error when Redis is not configured', () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    expect(() => RedisClient.getInstance()).toThrow('Redis configuration missing');

    // Restore
    process.env.REDIS_URL = 'redis://mock:6379';
    process.env.REDIS_TOKEN = 'mock-token';
  });

  it('should return false from isConfigured when not configured', () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const result = RedisClient.isConfigured();

    expect(result).toBe(false);

    // Restore
    process.env.REDIS_URL = 'redis://mock:6379';
    process.env.REDIS_TOKEN = 'mock-token';
  });
});
