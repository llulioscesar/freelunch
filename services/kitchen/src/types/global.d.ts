/**
 * Global Type Definitions
 * Kitchen Service
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
      ORDERS_EVENTS_STREAM: string;
      KITCHEN_EVENTS_STREAM: string;
      KITCHEN_CONSUMER_GROUP: string;

      // Warehouse Communication
      WAREHOUSE_REQUESTS_STREAM: string;
      WAREHOUSE_RESPONSES_STREAM: string;
      WAREHOUSE_CONSUMER_GROUP: string;

      // Environment
      NODE_ENV: 'development' | 'test' | 'production';
      LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    }
  }
}

export {};
