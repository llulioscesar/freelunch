/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/kitchen_test';
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.ORDERS_EVENTS_STREAM = 'test:orders:events';
process.env.KITCHEN_EVENTS_STREAM = 'test:kitchen:events';
process.env.KITCHEN_CONSUMER_GROUP = 'test-kitchen-group';
process.env.WAREHOUSE_REQUESTS_STREAM = 'test:warehouse:requests';
process.env.WAREHOUSE_RESPONSES_STREAM = 'test:warehouse:responses';
process.env.WAREHOUSE_CONSUMER_GROUP = 'test-warehouse-group';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);
