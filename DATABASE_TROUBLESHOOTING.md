# 🔧 Database Connection Troubleshooting

## 🚨 Database Migration Completed
```
✅ Successfully migrated from Supabase to Railway PostgreSQL
✅ All data preserved and verified
✅ Connection issues resolved
```

## 🛠️ Các bước sửa lỗi

### 1. Kiểm tra kết nối mạng
```bash
ping caboose.proxy.rlwy.net
```

### 2. Kiểm tra DATABASE_URL
```bash
# Xem nội dung file .env
type .env
```

### 3. Sửa lỗi Prisma
```bash
# Xóa cache Prisma
rmdir /s /q node_modules\.prisma

# Regenerate Prisma client
npx prisma generate

# Test connection
npx prisma db pull
```

### 4. Restart development server
```bash
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm run dev
```

### 5. Kiểm tra Supabase Dashboard
- Đăng nhập vào Supabase Dashboard
- Kiểm tra project status
- Verify connection string
- Check if database is paused

## 🔍 Debug Commands

### Kiểm tra health endpoint
```bash
curl http://localhost:3000/api/health
```

### Test database connection
```bash
npx prisma studio
```

## 🚀 Quick Fix Script
Chạy script tự động:
```bash
fix-database.bat
```

## 📋 Checklist

- [ ] Supabase project đang chạy
- [ ] DATABASE_URL đúng format
- [ ] Network connection ổn định
- [ ] Prisma client được generate
- [ ] Development server restart

## 🆘 Nếu vẫn lỗi

1. **Kiểm tra Supabase Dashboard:**
   - Project status
   - Database settings
   - Connection pooling

2. **Thử connection string mới:**
   - Copy connection string từ Supabase Dashboard
   - Update file .env
   - Restart server

3. **Contact support:**
   - Supabase support
   - Network administrator
   - Development team

## 📞 Emergency Contacts
- Railway Support: https://railway.app/support
- Documentation: https://docs.railway.app
