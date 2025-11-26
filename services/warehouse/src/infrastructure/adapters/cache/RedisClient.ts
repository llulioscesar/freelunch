/**
 * Redis Client Singleton
 * Warehouse Service
 *
 * Provides a single Redis connection shared across the application for:
 * - Event Streaming (Redis Streams)
 * - Caching (if needed)
 *
 * Uses Upstash Redis for serverless compatibility
 */
import { Redis } from '@upstash/redis';
import { logger } from '../../logging/Logger';

export class RedisClient {
  private static instance: Redis | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Get the singleton Redis instance
   */
  static getInstance(): Redis {
    if (!RedisClient.instance) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        throw new Error(
          'Redis configuration missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
        );
      }

      RedisClient.instance = new Redis({
        url,
        token,
        // Enable automatic retry for failed requests
        retry: {
          retries: 3,
          backoff: (retryCount) => Math.exp(retryCount) * 50,
        },
      });

      logger.info('✅ Redis client initialized');
    }

    return RedisClient.instance;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  static resetInstance(): void {
    RedisClient.instance = null;
  }

  /**
   * Check if Redis is configured
   */
  static isConfigured(): boolean {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    return !!(url && token);
  }
}
