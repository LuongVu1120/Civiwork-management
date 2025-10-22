@echo off
echo 🔍 Checking database connection...

echo.
echo 📋 Current DATABASE_URL:
findstr DATABASE_URL .env

echo.
echo 🛠️  Attempting to fix database connection...

echo.
echo 1. Stopping any running processes...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Clearing Prisma cache...
if exist node_modules\.prisma rmdir /s /q node_modules\.prisma

echo.
echo 3. Regenerating Prisma client...
call npx prisma generate

echo.
echo 4. Testing database connection...
call npx prisma db pull --preview-feature

echo.
echo 5. Starting development server...
call npm run dev

echo.
echo ✅ Database connection fix completed!
echo If issues persist, check your Supabase connection settings.
