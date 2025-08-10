#!/bin/bash

# 🔍 Debug Backend Build Script
# Script per diagnosticare problemi di build del backend

set -e

echo "🔍 Debugging backend build process..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Checking backend environment...${NC}"

# Vai nella directory backend
cd backend

echo -e "${YELLOW}1. Checking Node.js and npm versions...${NC}"
node --version
npm --version

echo -e "${YELLOW}2. Checking package.json...${NC}"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    grep -E '"build"|"start"' package.json || echo "⚠️  Build/start scripts not found"
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

echo -e "${YELLOW}3. Checking TypeScript config...${NC}"
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
else
    echo -e "${RED}❌ tsconfig.json not found${NC}"
fi

echo -e "${YELLOW}4. Checking source files...${NC}"
if [ -d "src" ]; then
    echo "✅ src directory exists"
    echo "Source files:"
    find src -name "*.ts" -type f | head -10
else
    echo -e "${RED}❌ src directory not found${NC}"
fi

echo -e "${YELLOW}5. Checking Prisma setup...${NC}"
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma schema exists"
else
    echo -e "${RED}❌ Prisma schema not found${NC}"
fi

echo -e "${YELLOW}6. Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}7. Generating Prisma client...${NC}"
npx prisma generate

echo -e "${YELLOW}8. Testing TypeScript compilation...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${YELLOW}Checking for TypeScript errors...${NC}"
    npx tsc --noEmit || true
    exit 1
fi

echo -e "${YELLOW}9. Checking built files...${NC}"
if [ -d "dist" ]; then
    echo "✅ dist directory created"
    echo "Built files:"
    find dist -name "*.js" -type f | head -5
else
    echo -e "${RED}❌ dist directory not created${NC}"
fi

echo -e "${GREEN}🎉 Backend build debugging complete!${NC}"
echo -e "${YELLOW}📝 Summary:${NC}"
echo "- Dependencies: Installed"
echo "- Prisma: Generated"
echo "- TypeScript: Compiled"
echo "- Output: Ready in dist/"

cd ..
