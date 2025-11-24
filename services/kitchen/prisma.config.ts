/**
 * Prisma Configuration for Kitchen Service
 * Prisma ORM v7 configuration file
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

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
    // Type-safe env() helper for environment variables
    url: env('DATABASE_URL'),
  },
});
