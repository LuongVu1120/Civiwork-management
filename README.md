# 🏗️ Civiwork Management System

Hệ thống quản lý thu chi và chấm công cho công trình xây dựng.

## ✨ Tính năng

- 👥 **Quản lý nhân sự**: Đội trưởng, thợ xây, thợ phụ, thuê ngoài
- 💰 **Tính lương**: Lương theo ngày với prorate chuẩn
- 🍽️ **Quản lý ăn uống**: Chi phí ăn cả ngày/nửa ngày
- 📊 **Báo cáo tài chính**: Thu chi, dòng tiền theo công trình
- 📱 **Giao diện mobile**: Tối ưu cho iPhone 12+
- 📈 **Dashboard**: Thống kê tổng quan
- 📤 **Xuất báo cáo**: Excel, PDF, JSON
- 💾 **Backup/Restore**: Sao lưu dữ liệu

## 🚀 Deploy lên Vercel

### 1. Cài đặt Vercel CLI
```bash
npm install -g vercel
```

### 2. Đăng nhập Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Cấu hình Environment Variables
Trong Vercel Dashboard, thêm:
- `DATABASE_URL`: URL kết nối Supabase PostgreSQL

### 5. Chạy Migration
```bash
vercel env pull .env.local
npx prisma migrate deploy
npx prisma generate
```

## 🗄️ Database Setup

### 1. Tạo Supabase Project
- Truy cập [supabase.com](https://supabase.com)
- Tạo project mới
- Lấy connection string từ Settings > Database

### 2. Cấu hình Database
```bash
# Copy .env.example thành .env
cp .env.example .env

# Cập nhật DATABASE_URL trong .env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Chạy migration
npx prisma migrate dev --name init

# Seed dữ liệu mẫu
npm run prisma:seed
```

## 🛠️ Development

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Chạy production
npm start
```

## 📱 Mobile Optimization

- Viewport tối ưu cho iPhone 12+
- Touch-friendly interface
- Responsive design
- PWA ready

## 🔧 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **UI**: Modern components với animations
- **Export**: ExcelJS, jsPDF

## 📊 Business Rules

- **Lương ngày**: Đội trưởng 500k, Thợ xây 420k, Thợ phụ 320k
- **Phụ cấp**: Đội trưởng 1.5tr/tháng
- **Prorate**: 0.5 cho nửa ngày, tính cuối tuần, trừ lễ
- **Ăn uống**: Cả ngày 80k, nửa ngày 40k

## 🚀 Deploy Commands

```bash
# Deploy lên Vercel
vercel

# Deploy với production build
vercel --prod

# Xem logs
vercel logs

# Xem domains
vercel domains
```

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:
1. Database connection
2. Environment variables
3. Prisma migration status
4. Build logs trong Vercel dashboard