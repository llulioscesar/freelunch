#!/usr/bin/env node
/**
 * Add .js extensions to relative imports in compiled JS files
 * Required for ES modules in Node.js
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');

async function* getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* getFiles(path);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      yield path;
    }
  }
}

async function addJsExtensions(filePath) {
  const content = await readFile(filePath, 'utf8');

  // Pattern to match relative imports without .js extension
  // Matches: from './path', from "../path", from '../../path'
  // But NOT: from './path.js', from '@package', from 'package'
  const pattern = /from\s+['"](\.\.[\/\\](?:[^'"]+)|\.\/(?:[^'"]+))(?<!\.js)['"]/g;

  let modified = false;
  const newContent = content.replace(pattern, (match, importPath) => {
    // Don't add .js if it already has an extension or is a directory import with index
    if (importPath.match(/\.(js|json|node)$/)) {
      return match;
    }
    modified = true;
    return match.replace(importPath, `${importPath}.js`);
  });

  if (modified) {
    await writeFile(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

async function main() {
  console.log('🔧 Adding .js extensions to imports...');

  let count = 0;
  let modified = 0;

  for await (const file of getFiles(distDir)) {
    count++;
    const wasModified = await addJsExtensions(file);
    if (wasModified) {
      modified++;
    }
  }

  console.log(`✅ Processed ${count} files, modified ${modified} files`);
}

main().catch((error) => {
  console.error('❌ Failed to add .js extensions:', error);
  process.exit(1);
});
