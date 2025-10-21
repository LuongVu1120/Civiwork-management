@echo off
echo 🔧 Fixing Next.js development issues...

echo Cleaning Next.js cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Cleaning npm cache...
npm cache clean --force

echo Reinstalling dependencies...
npm install

echo Generating Prisma client...
npx prisma generate

echo ✅ Fix completed! You can now run 'npm run dev'
pause
