/**
 * Prisma Client Configuration
 * Prisma ORM v7 with PostgreSQL Adapter
 */
import { PrismaClient as BasePrismaClient } from '../../../generated/prisma/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from '../../logging/Logger.js';

let prismaInstance: BasePrismaClient | null = null;
let poolInstance: pg.Pool | null = null;

/**
 * Singleton for Prisma Client
 */
export class PrismaClientSingleton {
  static getInstance(): BasePrismaClient {
    if (!prismaInstance) {
      // PostgreSQL Pool configuration optimized for serverless
      const poolConfig: pg.PoolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        // Serverless optimizations - limit connections per instance
        max: 1, // Maximum 1 connection per serverless instance
        idleTimeoutMillis: 10000, // Close idle connections after 10s
        connectionTimeoutMillis: 5000, // Fail fast if can't connect
      };

      poolInstance = new pg.Pool(poolConfig);
      const adapter = new PrismaPg(poolInstance);

      prismaInstance = new BasePrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === 'production'
            ? ['error']
            : ['query', 'error', 'warn'],
      });

      // Log connection
      prismaInstance
        .$connect()
        .then(() => {
          logger.info('Database connected successfully');
        })
        .catch((error: any) => {
          logger.error('Database connection failed', error);
        });
    }

    return prismaInstance;
  }

  static async disconnect(): Promise<void> {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      prismaInstance = null;
    }
    if (poolInstance) {
      await poolInstance.end();
      poolInstance = null;
    }
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database connections...');
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connections...');
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

// Also export direct instance for backward compatibility
export const prismaClient = PrismaClientSingleton.getInstance();
