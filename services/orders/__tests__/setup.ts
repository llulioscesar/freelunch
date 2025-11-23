/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/orders_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.LOG_LEVEL = 'silent'; // Disable logs in tests

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidOrderId(received: string) {
    const pattern = /^ORD-[A-Z0-9]+-[A-Z0-9]+$/;
    const pass = pattern.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid OrderId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid OrderId (format: ORD-{timestamp}-{random} in UPPERCASE)`,
        pass: false,
      };
    }
  },

  toBeValidOrderItemId(received: string) {
    const pattern = /^ITEM-\d+-[a-z0-9]+$/;
    const pass = pattern.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid OrderItemId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid OrderItemId (format: ITEM-{timestamp}-{random})`,
        pass: false,
      };
    }
  },
});
