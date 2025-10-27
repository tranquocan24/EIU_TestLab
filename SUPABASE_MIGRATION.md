# Migration to Supabase - Hướng dẫn chi tiết

## 📋 Yêu cầu
- Tài khoản Supabase (miễn phí)
- Node.js và npm đã cài đặt
- Prisma CLI

## 🚀 Bước 1: Tạo Project trên Supabase

1. Truy cập: https://supabase.com
2. Đăng nhập hoặc tạo tài khoản mới
3. Click **"New Project"**
4. Điền thông tin:
   - **Name**: `online-exam-system` hoặc tên bạn muốn
   - **Database Password**: Tạo mật khẩu mạnh (LƯU LẠI mật khẩu này!)
   - **Region**: Chọn `Southeast Asia (Singapore)` (gần Việt Nam nhất)
   - **Pricing Plan**: Free (đủ cho development)
5. Click **"Create new project"**
6. Đợi ~2 phút để Supabase khởi tạo database

## 🔑 Bước 2: Lấy Connection String

1. Sau khi project được tạo, vào **Settings** (biểu tượng bánh răng)
2. Click **Database** trong sidebar
3. Scroll xuống phần **Connection string**
4. Chọn tab **URI**
5. Copy connection string có dạng:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. Thay `[YOUR-PASSWORD]` bằng mật khẩu bạn đã tạo ở bước 1

## 📝 Bước 3: Cập nhật .env file

Tạo hoặc cập nhật file `.env` trong thư mục `backend/`:

```env
# Supabase Database Connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Application
PORT=3001
NODE_ENV=development
```

**Lưu ý quan trọng:**
- `DATABASE_URL`: Thêm `?pgbouncer=true` ở cuối (dùng cho Prisma Migrate)
- `DIRECT_URL`: Không có `?pgbouncer=true` (dùng cho migrations)
- Thay `[YOUR-PASSWORD]` bằng mật khẩu thật

## 🔧 Bước 4: Cập nhật Prisma Schema

File `backend/prisma/schema.prisma` đã được cấu hình sẵn để hỗ trợ Supabase.

Cần thêm `directUrl` để Prisma Migrate hoạt động với Supabase:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 🗄️ Bước 5: Chạy Migration

Mở terminal trong thư mục `backend/` và chạy:

```bash
# 1. Cài đặt dependencies nếu chưa có
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Chạy migrations để tạo bảng trên Supabase
npx prisma migrate deploy

# Hoặc nếu muốn tạo migration mới:
npx prisma migrate dev --name init

# 4. (Optional) Seed dữ liệu mẫu
npx prisma db seed
```

## 🌱 Bước 6: Seed dữ liệu (Optional)

Tạo file `backend/prisma/seed.ts` để thêm dữ liệu mẫu:

```typescript
import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash password
  const hashedPassword = await bcrypt.hash('123456', 10)

  // Create users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      email: 'admin@eiu.edu.vn',
      role: UserRole.ADMIN,
    },
  })

  const teacher = await prisma.user.upsert({
    where: { username: 'giaovien' },
    update: {},
    create: {
      username: 'giaovien',
      password: hashedPassword,
      name: 'Giáo Viên',
      email: 'giaovien@eiu.edu.vn',
      role: UserRole.TEACHER,
    },
  })

  const student = await prisma.user.upsert({
    where: { username: 'nphau' },
    update: {},
    create: {
      username: 'nphau',
      password: hashedPassword,
      name: 'Nguyễn Phương Hậu',
      email: 'nphau@student.eiu.edu.vn',
      role: UserRole.STUDENT,
    },
  })

  console.log('✅ Created users:', { admin, teacher, student })
  console.log('🔑 Default password for all users: 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Thêm vào `backend/package.json`:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

## ✅ Bước 7: Test kết nối

Chạy backend để kiểm tra:

```bash
cd backend
npm run start:dev
```

Nếu thấy log:
```
✅ Database connected
[Nest] ... LOG [NestApplication] Nest application successfully started
```

→ Kết nối Supabase thành công! 🎉

## 👥 Bước 8: Chia sẻ với bạn

### Cách 1: Chia sẻ Connection String (Đơn giản)

1. Gửi cho bạn connection string trong file `.env`
2. Bạn tạo file `.env` giống hệt và chạy project

### Cách 2: Invite vào Supabase Project (Bảo mật hơn)

1. Vào Supabase Dashboard
2. Chọn project của bạn
3. Settings → Team
4. Click **"Invite"**
5. Nhập email của bạn bè
6. Họ sẽ nhận email và có thể truy cập project

### Cách 3: Push lên Git (Khuyến nghị)

1. **Thêm `.env` vào `.gitignore`**:
   ```
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Tạo file `.env.example`**:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
   
   # JWT
   JWT_SECRET="your-secret-key"
   JWT_EXPIRES_IN="7d"
   
   # App
   PORT=3001
   NODE_ENV=development
   ```

3. **Commit và push lên GitHub**:
   ```bash
   git add .
   git commit -m "Migrate to Supabase database"
   git push origin BranchHau
   ```

4. **Bạn bè làm theo**:
   ```bash
   git pull origin BranchHau
   cp .env.example .env
   # Sửa .env với connection string thật
   npm install
   npx prisma generate
   npm run start:dev
   ```

## 🔍 Kiểm tra Database trên Supabase

1. Vào Supabase Dashboard
2. Click **Table Editor** trong sidebar
3. Bạn sẽ thấy các bảng: `users`, `exams`, `questions`, `attempts`, etc.
4. Click vào từng bảng để xem dữ liệu

## 🛠️ Troubleshooting

### Lỗi: "Can't reach database server"
- Kiểm tra lại connection string
- Đảm bảo mật khẩu đúng
- Kiểm tra internet connection

### Lỗi: "Migration failed"
- Xóa thư mục `backend/prisma/migrations`
- Chạy lại: `npx prisma migrate dev --name init`

### Lỗi: "P1001: Can't reach database"
- Kiểm tra `DIRECT_URL` trong `.env`
- Thử remove `?pgbouncer=true` từ `DIRECT_URL`

### Database bị duplicate data
```bash
# Reset database (XÓA TẤT CẢ DỮ LIỆU!)
npx prisma migrate reset

# Seed lại
npx prisma db seed
```

## 📊 Theo dõi Database

Supabase cung cấp nhiều công cụ hữu ích:

1. **Table Editor**: Xem/sửa dữ liệu trực tiếp
2. **SQL Editor**: Chạy SQL queries
3. **Database → Logs**: Xem query logs
4. **Database → Backups**: Tự động backup mỗi ngày

## 🎯 Lợi ích của Supabase

✅ **Miễn phí** cho development (500MB database, 2GB bandwidth/tháng)  
✅ **Tự động backup** mỗi ngày  
✅ **SSL/TLS** mặc định (bảo mật)  
✅ **Dashboard** để quản lý database  
✅ **Nhiều người** có thể cùng truy cập  
✅ **Authentication** sẵn (có thể dùng sau)  
✅ **Realtime** subscriptions (có thể dùng cho Socket.IO)  

## 🔐 Bảo mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG** commit file `.env` lên Git
- **KHÔNG** share connection string công khai
- Đổi `JWT_SECRET` thành giá trị ngẫu nhiên
- Trong production, dùng mật khẩu database mạnh hơn

## 📝 Checklist

- [ ] Tạo Supabase project
- [ ] Copy connection string
- [ ] Tạo file `.env` trong `backend/`
- [ ] Cập nhật `schema.prisma` với `directUrl`
- [ ] Chạy `npx prisma generate`
- [ ] Chạy `npx prisma migrate deploy` hoặc `migrate dev`
- [ ] (Optional) Chạy `npx prisma db seed`
- [ ] Test backend: `npm run start:dev`
- [ ] Kiểm tra bảng trên Supabase Dashboard
- [ ] Push code lên Git
- [ ] Share với bạn (invite hoặc connection string)

---

**Hoàn thành!** 🎉

Database của bạn giờ đã online và có thể truy cập từ mọi nơi. Bạn và bạn bè có thể cùng làm việc trên cùng một database!
