#!/usr/bin/env node
/**
 * Post-generate script for Prisma
 * Creates an index.ts file in the generated client directory to allow direct imports
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientDir = join(__dirname, '..', 'src', 'generated', 'prisma', 'client');
const indexPath = join(clientDir, 'index.ts');

const indexContent = `/**
 * Re-export from client.ts to allow importing from the client directory directly
 */
export * from './client.js';
export { PrismaClient } from './client.js';
export type { Prisma } from './client.js';
`;

try {
  writeFileSync(indexPath, indexContent, 'utf8');
  console.log('✅ Generated index.ts for Prisma client');
} catch (error) {
  console.error('❌ Failed to generate index.ts:', error);
  process.exit(1);
}
