/**
 * Prisma Client Configuration
 * Prisma ORM v7 with PostgreSQL Adapter
 */
import { PrismaClient as BasePrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from '../../logging/Logger';

// PostgreSQL Pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

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
  .catch((error) => {
    logger.error('❌ Database connection failed', error);
    process.exit(1);
  });
