/**
 * Prisma Client Configuration
 * Prisma ORM v7 with PostgreSQL Adapter
 */
import { PrismaClient as BasePrismaClient } from '../../../generated/prisma/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from '../../logging/Logger.js';

// PostgreSQL Pool configuration
const poolConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// SSL Configuration - if CA certificate is provided, use it
// Both preview and production databases require SSL with the same CA cert
if (process.env.DATABASE_CA_CERT) {
  poolConfig.ssl = {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT,
  };
}

const pool = new pg.Pool(poolConfig);

// Prisma Adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Prisma Client instance with adapter
export const prismaClient = new BasePrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'production'
    ? ['error']
    : ['query', 'error', 'warn'],
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database connections...');
  await prismaClient.$disconnect();
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connections...');
  await prismaClient.$disconnect();
  await pool.end();
  process.exit(0);
});

// Log connection status
prismaClient.$connect()
  .then(() => {
    logger.info('✅ Database connected successfully');
  })
  .catch((error: any) => {
    logger.error('❌ Database connection failed', error);
    process.exit(1);
  });
