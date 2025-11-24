/**
 * Prisma Configuration for Kitchen Service
 * Prisma ORM v7 configuration file
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Schema location
  schema: 'prisma/schema.prisma',

  // Migrations configuration
  migrations: {
    path: 'prisma/migrations',
    // Seed script (if needed later)
    // seed: 'tsx prisma/seed.ts',
  },

  // Database connection
  datasource: {
    // Use process.env with fallback for CI/build environments
    url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  },
});
