/**
 * Adapter: System Health Checker
 *
 * Implements health checks for infrastructure components
 */
import { PrismaClient } from '@prisma/client';
import { Client } from '@upstash/qstash';
import {
  HealthChecker,
  CheckStatus,
} from '../../../application/services/HealthCheckService';

export class SystemHealthChecker implements HealthChecker {
  private prisma: PrismaClient;
  private qstashClient: Client | null;

  constructor() {
    this.prisma = new PrismaClient();

    // Only initialize QStash if token is available
    this.qstashClient = process.env.QSTASH_TOKEN
      ? new Client({ token: process.env.QSTASH_TOKEN })
      : null;
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
      // Check if QStash token is configured
      if (!this.qstashClient) {
        return {
          status: 'degraded',
          message: 'QStash not configured (running in test mode)',
          responseTime: Date.now() - startTime,
          details: {
            provider: 'QStash',
            configured: false,
          },
        };
      }

      // For QStash, we just verify the client is initialized
      // Actual connectivity check would require making a test publish
      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        message: 'Event publisher configured',
        responseTime,
        details: {
          provider: 'QStash',
          configured: true,
        },
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: 'Event publisher unavailable',
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
        'QSTASH_TOKEN',
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
            qstash: !!process.env.QSTASH_TOKEN,
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
