/**
 * Adapter: System Health Checker
 *
 * Implements health checks for infrastructure components
 */
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';
import { RedisClient } from '../cache/RedisClient';
import {
  HealthChecker,
  CheckStatus,
} from '../../../application/services/HealthCheckService';

export class SystemHealthChecker implements HealthChecker {
  private prisma: PrismaClient;
  private redis: Redis | null;

  constructor() {
    this.prisma = new PrismaClient();

    // Only initialize Redis if configured
    this.redis = RedisClient.isConfigured() ? RedisClient.getInstance() : null;
  }

  async checkDatabase(): Promise<CheckStatus> {
    const startTime = Date.now();

    try {
      // Simple query to verify DB connection
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'up' : 'degraded',
        message:
          responseTime < 1000
            ? 'Database connection healthy'
            : 'Database responding slowly',
        responseTime,
        details: {
          provider: 'PostgreSQL',
          latency: `${responseTime}ms`,
        },
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: 'Database connection failed',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  async checkEventPublisher(): Promise<CheckStatus> {
    const startTime = Date.now();

    try {
      // Check if Redis is configured
      if (!this.redis) {
        return {
          status: 'degraded',
          message: 'Redis not configured (events disabled)',
          responseTime: Date.now() - startTime,
          details: {
            provider: 'Redis Streams',
            configured: false,
          },
        };
      }

      // Test Redis connectivity with PING
      const pingResult = await this.redis.ping();
      const responseTime = Date.now() - startTime;

      if (pingResult === 'PONG') {
        return {
          status: 'up',
          message: 'Redis Streams ready for events',
          responseTime,
          details: {
            provider: 'Redis Streams',
            configured: true,
            latency: `${responseTime}ms`,
          },
        };
      }

      return {
        status: 'down',
        message: 'Redis not responding',
        responseTime,
        details: {
          provider: 'Redis Streams',
          pingResult,
        },
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: 'Redis connection failed',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  async checkConfiguration(): Promise<CheckStatus> {
    const startTime = Date.now();

    try {
      const requiredEnvVars = ['DATABASE_URL'];
      const optionalEnvVars = [
        'REDIS_URL',
        'REDIS_TOKEN',
        'KITCHEN_SERVICE_URL',
        'WAREHOUSE_SERVICE_URL',
        'MARKET_SERVICE_URL',
      ];

      const missingRequired = requiredEnvVars.filter(
        (varName) => !process.env[varName]
      );

      const missingOptional = optionalEnvVars.filter(
        (varName) => !process.env[varName]
      );

      if (missingRequired.length > 0) {
        return {
          status: 'down',
          message: 'Missing required configuration',
          responseTime: Date.now() - startTime,
          details: {
            missingRequired,
            missingOptional,
          },
        };
      }

      if (missingOptional.length > 0) {
        return {
          status: 'degraded',
          message: 'Some optional configuration missing',
          responseTime: Date.now() - startTime,
          details: {
            missingOptional,
          },
        };
      }

      return {
        status: 'up',
        message: 'All configuration present',
        responseTime: Date.now() - startTime,
        details: {
          environment: process.env.NODE_ENV || 'development',
          configured: {
            database: !!process.env.DATABASE_URL,
            redis: RedisClient.isConfigured(),
            services: {
              kitchen: !!process.env.KITCHEN_SERVICE_URL,
              warehouse: !!process.env.WAREHOUSE_SERVICE_URL,
              market: !!process.env.MARKET_SERVICE_URL,
            },
          },
        },
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: 'Configuration check failed',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
