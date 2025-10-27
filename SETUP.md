# 🚀 Hướng dẫn Setup Project - Online Exam System

## 📋 Yêu cầu

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** hoặc **yarn**
- **Git** ([Download](https://git-scm.com/))
- Tài khoản **Supabase** (được chia sẻ hoặc tạo mới miễn phí)

---

## 📥 Bước 1: Clone Repository

```bash
git clone https://github.com/tranquocan24/Online_Exam_System.git
cd Online_Exam_System
```

---

## ⚙️ Bước 2: Setup Backend

### 2.1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2.2. Cấu hình Environment Variables

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Hoặc trên Windows PowerShell:
copy .env.example .env
```

### 2.3. Cập nhật Database Password trong `.env`

Mở file `backend/.env` và **thay `[YOUR_PASSWORD]`** bằng mật khẩu database thật:

```env
# TRƯỚC (trong .env.example):
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.hcgytexcnrrwqyfspmrm.supabase.co:5432/postgres"

# SAU (trong .env) - Thay YOUR_PASSWORD:
DATABASE_URL="postgresql://postgres:Pin%40016682@db.hcgytexcnrrwqyfspmrm.supabase.co:5432/postgres"
```

**⚠️ Lưu ý:** 
- Hỏi người quản lý project để lấy mật khẩu database
- Nếu password có ký tự đặc biệt, cần encode: `@` → `%40`, `#` → `%23`
- Cập nhật cả `DATABASE_URL` VÀ `DIRECT_URL`

### 2.4. Generate Prisma Client

```bash
npx prisma generate
```

### 2.5. (Optional) Kiểm tra kết nối Database

```bash
# Xem các bảng đã có trong database
npx prisma studio

# Sẽ mở trình duyệt tại: http://localhost:5555
```

---

## 🎨 Bước 3: Setup Frontend

### 3.1. Cài đặt dependencies

```bash
# Từ thư mục root
cd ../frontend
npm install
```

### 3.2. (Optional) Cấu hình Environment Variables

Frontend đã có cấu hình mặc định kết nối tới `http://localhost:3001`.

Nếu cần thay đổi, tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🚀 Bước 4: Chạy Project

### Cách 1: Chạy từng server riêng (Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Cách 2: Chạy cả 2 server cùng lúc

**Từ thư mục root:**
```bash
npm run dev
```

---

## 🌐 Truy cập Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (nếu đang chạy)

---

## 🔑 Tài khoản Test

Database đã có sẵn các tài khoản test:

| Username | Password | Role | Mô tả |
|----------|----------|------|-------|
| `admin` | `123456` | ADMIN | Quản trị viên |
| `teacher1` | `123456` | TEACHER | Giáo viên 1 |
| `teacher2` | `123456` | TEACHER | Giáo viên 2 |
| `student1` | `123456` | STUDENT | Sinh viên 1 |
| `student2` | `123456` | STUDENT | Sinh viên 2 |
| `student3` | `123456` | STUDENT | Sinh viên 3 |

### Đăng nhập:

1. Truy cập: http://localhost:3000/login
2. Nhập username và password từ bảng trên
3. Hệ thống sẽ tự động redirect dựa trên role:
   - Admin → `/admin`
   - Teacher → `/teacher`
   - Student → `/student`

---

## 🗄️ Database (Supabase)

### Xem Database Online

1. Truy cập: https://supabase.com/dashboard
2. Đăng nhập (hoặc được invite vào project)
3. Chọn project: **Online Exam System**
4. Click **Table Editor** để xem dữ liệu

### Reset Database (Nếu cần)

**⚠️ CẢNH BÁO: Lệnh này sẽ XÓA TẤT CẢ dữ liệu!**

```bash
cd backend
npx prisma migrate reset
# Chọn 'y' để confirm
```

Sau đó seed lại dữ liệu:

```bash
npx prisma db seed
```

---

## 🛠️ Troubleshooting

### ❌ Lỗi: "Authentication failed against database server"

**Nguyên nhân:** Mật khẩu database sai hoặc chưa cập nhật trong `.env`

**Giải pháp:**
1. Kiểm tra lại mật khẩu trong file `backend/.env`
2. Hỏi người quản lý project để lấy mật khẩu đúng
3. Nếu password có `@`, encode thành `%40`

### ❌ Lỗi: "Port 3000 or 3001 already in use"

**Giải pháp:**

**Windows:**
```powershell
# Tìm process đang dùng port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (thay PID bằng số từ lệnh trên)
taskkill /PID [PID] /F
```

**macOS/Linux:**
```bash
# Kill process trên port 3000
lsof -ti:3000 | xargs kill -9

# Kill process trên port 3001
lsof -ti:3001 | xargs kill -9
```

### ❌ Lỗi: "Cannot find module '@prisma/client'"

**Giải pháp:**
```bash
cd backend
npx prisma generate
```

### ❌ Lỗi: "Module not found" hoặc dependencies lỗi

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Hoặc Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 📁 Cấu trúc Project

```
Online_Exam_System/
├── backend/                 # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # Users module
│   │   ├── exams/          # Exams module
│   │   ├── questions/      # Questions module
│   │   └── attempts/       # Attempts module
│   └── .env                # Environment variables (KHÔNG commit)
│
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   │   ├── (public)/  # Public pages (login, register)
│   │   │   └── (dashboard)/ # Protected pages
│   │   │       ├── admin/   # Admin pages
│   │   │       ├── teacher/ # Teacher pages
│   │   │       └── student/ # Student pages
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom hooks
│   │   └── stores/         # Zustand stores
│   └── .env.local          # Frontend env (optional)
│
└── README.md
```

---

## 🔗 Tài nguyên

- **Backend (NestJS)**: https://docs.nestjs.com/
- **Frontend (Next.js)**: https://nextjs.org/docs
- **Prisma ORM**: https://www.prisma.io/docs
- **Supabase**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com/

---

## 👥 Team Collaboration

### Lấy code mới nhất

```bash
git pull origin BranchHau
```

### Commit và push code

```bash
git add .
git commit -m "Your message"
git push origin BranchHau
```

### Nếu gặp conflict

```bash
# Lấy code mới nhất
git pull origin BranchHau

# Giải quyết conflict trong editor
# Sau đó:
git add .
git commit -m "Resolve merge conflicts"
git push origin BranchHau
```

---

## 📞 Liên hệ

Nếu gặp vấn đề, hãy liên hệ:
- **GitHub Issues**: https://github.com/tranquocan24/Online_Exam_System/issues
- **Team Lead**: [Your Name/Contact]

---

**Chúc bạn code vui vẻ! 🎉**
