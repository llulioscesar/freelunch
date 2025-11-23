/**
 * Redis Client Singleton
 *
 * Provides a single Redis connection shared across the application for:
 * - Caching (Repository layer)
 * - Event Streaming (Pub/Sub layer)
 *
 * Uses Upstash Redis for serverless compatibility
 */
import { Redis } from '@upstash/redis';

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
      const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        throw new Error(
          'Redis configuration missing. Set REDIS_URL and REDIS_TOKEN environment variables.'
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

      console.log('✅ Redis client initialized');
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
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return !!(url && token);
  }
}
