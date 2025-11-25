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
      // PostgreSQL Pool configuration
      const poolConfig: pg.PoolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
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
