#!/bin/bash

# Database connection test and fix script
echo "🔍 Checking database connection..."

# Test database connection
echo "Testing Prisma connection..."
npx prisma db pull --preview-feature 2>&1 | head -10

echo ""
echo "🔧 Database connection troubleshooting:"
echo "1. Check if Supabase is running"
echo "2. Verify DATABASE_URL in .env file"
echo "3. Check network connectivity"
echo "4. Try regenerating Prisma client"

echo ""
echo "📋 Current DATABASE_URL:"
grep DATABASE_URL .env

echo ""
echo "🛠️  Suggested fixes:"
echo "1. Update .env with correct Supabase URL"
echo "2. Run: npx prisma generate"
echo "3. Run: npx prisma db push"
echo "4. Restart the development server"

echo ""
echo "🚀 Quick fixes to try:"
echo "npm run dev -- --reset-cache"
