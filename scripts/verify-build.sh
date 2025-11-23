#!/bin/bash

# Script de verificación pre-push
# Ejecuta todas las verificaciones que se ejecutarán en CI/CD

set -e  # Exit on any error

echo "🔍 Verificando el proyecto antes de push..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Linting
echo "${YELLOW}📝 Step 1/4: Running ESLint...${NC}"
npm run lint
echo "${GREEN}✅ Linting passed${NC}"
echo ""

# Step 2: Type Check
echo "${YELLOW}📝 Step 2/4: Type checking with TypeScript...${NC}"
npx tsc --noEmit
echo "${GREEN}✅ Type check passed${NC}"
echo ""

# Step 3: Tests & Coverage
echo "${YELLOW}📝 Step 3/4: Running tests with coverage...${NC}"
npm run test:coverage
echo "${GREEN}✅ Tests passed with coverage${NC}"
echo ""

# Step 4: Build
echo "${YELLOW}📝 Step 4/4: Building project...${NC}"
npm run build
echo "${GREEN}✅ Build successful${NC}"
echo ""

# Summary
echo ""
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✅ ALL CHECKS PASSED!${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Tu código está listo para push 🚀"
echo ""
