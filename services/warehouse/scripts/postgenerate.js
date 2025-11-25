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
const packageJsonPath = join(clientDir, 'package.json');

const indexContent = `/**
 * Re-export from client.ts to allow importing from the client directory directly
 */
export * from './client.js';
export { PrismaClient } from './client.js';
export type { Prisma } from './client.js';
`;

const packageJsonContent = JSON.stringify({
  type: 'module',
  main: './index.js',
  types: './index.d.ts'
}, null, 2);

try {
  writeFileSync(indexPath, indexContent, 'utf8');
  writeFileSync(packageJsonPath, packageJsonContent, 'utf8');
  console.log('✅ Generated index.ts and package.json for Prisma client');
} catch (error) {
  console.error('❌ Failed to generate files:', error);
  process.exit(1);
}
