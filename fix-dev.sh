#!/bin/bash

echo "🔧 Fixing Next.js development issues..."

# Clean cache
echo "Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "✅ Fix completed! You can now run 'npm run dev'"
