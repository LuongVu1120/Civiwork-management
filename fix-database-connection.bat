@echo off
echo 🔧 Database Connection Fix Script
echo ================================

echo.
echo 📋 Step 1: Checking current DATABASE_URL...
findstr DATABASE_URL .env

echo.
echo 📋 Step 2: Testing database connection...
npx prisma db pull --preview-feature 2>&1 | findstr /C:"Error" /C:"success" /C:"connected"

echo.
echo 📋 Step 3: Regenerating Prisma client...
npx prisma generate

echo.
echo 📋 Step 4: Testing health endpoint...
timeout /t 3 /nobreak >nul
curl -s http://localhost:3000/api/health 2>nul | findstr /C:"connected" /C:"healthy" /C:"unhealthy"

echo.
echo 📋 Step 5: Starting development server...
echo Starting server in background...
start /b npm run dev

echo.
echo ✅ Database fix completed!
echo.
echo 🎯 Next steps:
echo 1. Wait for server to start (check browser)
echo 2. Test the cashflow page
echo 3. If still having issues, check Supabase dashboard
echo.
pause
