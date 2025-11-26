#!/usr/bin/env node
/**
 * Post-build script
 * Copies package.json to the dist directory for ES module resolution
 */
import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcPackageJson = join(__dirname, '..', 'src', 'generated', 'prisma', 'client', 'package.json');
const distClientDir = join(__dirname, '..', 'dist', 'generated', 'prisma', 'client');
const distPackageJson = join(distClientDir, 'package.json');

try {
  // Ensure dist client directory exists
  mkdirSync(distClientDir, { recursive: true });

  // Copy package.json
  copyFileSync(srcPackageJson, distPackageJson);

  console.log('✅ Copied package.json to dist directory');
} catch (error) {
  console.error('❌ Failed to copy package.json:', error);
  process.exit(1);
}
