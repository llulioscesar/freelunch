/**
 * Global Type Definitions
 * Warehouse Service
 */

// Extend Node.js process environment
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;

      // Redis (Upstash)
      UPSTASH_REDIS_REST_URL: string;
      UPSTASH_REDIS_REST_TOKEN: string;

      // Event Streams
      WAREHOUSE_REQUESTS_STREAM: string;
      WAREHOUSE_RESPONSES_STREAM: string;
      WAREHOUSE_CONSUMER_GROUP: string;

      // Farmers Market API
      MARKET_API_URL: string;

      // Environment
      NODE_ENV: 'development' | 'test' | 'production';
      LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    }
  }
}

export {};
