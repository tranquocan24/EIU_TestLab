<div align="center">

# 🎓 EIU TestLab

### Hệ thống Thi Trực tuyến - Đại học Quốc tế Miền Đông

[![Node.js](https://img.shields.io/badge/Node.js-14+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

**EIU TestLab** là hệ thống thi trực tuyến hiện đại được xây dựng dành riêng cho Đại học Quốc tế Miền Đông (Eastern International University), sử dụng kiến trúc fullstack với NestJS backend và Next.js frontend.

[Tính năng](#-tính-năng) •
[Công nghệ](#-công-nghệ-sử-dụng) •
[Cài đặt](#-cài-đặt) •
[Sử dụng](#-hướng-dẫn-sử-dụng) •
[API](#-api-documentation)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [API Documentation](#-api-documentation)
- [Tài khoản demo](#-tài-khoản-demo)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Giới thiệu

**EIU TestLab** là một nền tảng thi trực tuyến toàn diện, được thiết kế để đáp ứng nhu cầu giảng dạy và học tập tại Đại học Quốc tế Miền Đông. Hệ thống cung cấp trải nghiệm thi cử hiện đại, an toàn và dễ sử dụng cho cả giảng viên và sinh viên.

### ✨ Điểm nổi bật

- 🎨 **Giao diện hiện đại**: Thiết kế theo EIU Brand Guidelines với Tailwind CSS và shadcn/ui
- 🔐 **Bảo mật cao**: JWT authentication, role-based access control
- ⚡ **Realtime**: WebSocket cho notifications và exam monitoring
- 📱 **Responsive**: Tối ưu cho mọi thiết bị (Desktop, Tablet, Mobile)
- 📝 **Markdown Import**: Import đề thi nhanh chóng từ file Markdown
- 📊 **Analytics**: Thống kê và báo cáo chi tiết
- 🌐 **Multi-role**: Hỗ trợ Admin, Teacher, và Student roles

---

## 🚀 Tính năng

### 👨‍🎓 Dành cho Sinh viên

- ✅ Dashboard cá nhân với thống kê chi tiết
- ✅ Xem danh sách bài thi khả dụng theo môn học
- ✅ Làm bài thi trực tuyến với nhiều loại câu hỏi (Multiple choice, Essay, True/False)
- ✅ Tự động lưu tiến trình làm bài
- ✅ Xem kết quả và lịch sử thi
- ✅ Nhận thông báo realtime về bài thi mới
- ✅ **Hệ thống chống gian lận** (Anti-cheating) khi làm bài

### 👨‍🏫 Dành cho Giảng viên

- ✅ Dashboard quản lý với overview analytics
- ✅ Tạo và quản lý môn học (Courses)
- ✅ Tạo đề thi với question bank
- ✅ **Import đề thi từ Markdown** (hỗ trợ bulk import)
- ✅ Quản lý đề thi với filters và search
- ✅ Xem kết quả thi của sinh viên
- ✅ Thống kê chi tiết theo môn học/bài thi
- ✅ Export kết quả ra CSV/Excel

### 👨‍💼 Dành cho Admin

- ✅ Quản lý người dùng (CRUD operations)
- ✅ Import sinh viên hàng loạt từ CSV
- ✅ Quản lý môn học và phân quyền
- ✅ System monitoring và logs
- ✅ Thống kê toàn hệ thống

---

## 🛡️ Hệ thống chống gian lận (Anti-Cheating)

EIU TestLab tích hợp **8 biện pháp chống gian lận** để đảm bảo tính công bằng và minh bạch trong quá trình thi:

### 1. Chế độ toàn màn hình (Fullscreen Mode)
- 🔒 **Bắt buộc** làm bài trong chế độ toàn màn hình
- ⚠️ **Cảnh báo tự động**: Thoát toàn màn hình 3 lần → Tự động nộp bài
- 📊 Giám sát realtime và ghi log mỗi lần thoát fullscreen

### 2. Phát hiện chuyển Tab/Cửa sổ
- 👁️ Giám sát khi sinh viên **chuyển sang tab/cửa sổ khác**
- ⚠️ **Hệ thống cảnh báo**: Chuyển tab 3 lần → Tự động nộp bài
- 🔔 Hiển thị modal cảnh báo với số lần vi phạm còn lại

### 3. Chặn Copy/Paste
- 🚫 Ngăn chặn hoàn toàn việc **sao chép** nội dung đề thi
- 🚫 Vô hiệu hóa `Ctrl+C`, `Ctrl+V`, `Ctrl+X`
- 🔐 Bảo vệ nội dung đề thi khỏi bị sao chép ra ngoài

### 4. Chặn chuột phải (Right-click)
- 🖱️ Vô hiệu hóa **context menu** (menu chuột phải)
- 🚫 Ngăn chặn "Inspect Element" và các developer tools
- 🔒 Bảo vệ nguồn code và nội dung trang

### 5. Chặn chọn văn bản (Text Selection)
- 📝 Disable khả năng **highlight/chọn text**
- 🚫 Sử dụng CSS `user-select: none`
- 🔐 Ngăn chặn việc chụp màn hình với text được chọn

### 6. Ẩn Navigation trong chế độ thi
- 👻 Tự động **ẩn Navbar/Header** khi vào chế độ làm bài
- 🎯 Tập trung 100% vào nội dung đề thi
- 🚫 Giảm khả năng điều hướng ra khỏi trang thi

### 7. Auto-save & Session Recovery
- 💾 **Tự động lưu** tiến trình làm bài mỗi 30 giây
- 🔄 **Khôi phục session** nếu bị gián đoạn không mong muốn
- ⏱️ Đồng bộ thời gian làm bài chính xác

### 8. Tự động nộp bài khi hết giờ
- ⏰ **Countdown timer** hiển thị thời gian còn lại
- 🔴 Cảnh báo khi còn < 5 phút
- ✅ **Tự động nộp bài** ngay khi hết thời gian

### Triển khai kỹ thuật

```typescript
// File: frontend/src/app/(dashboard)/student/exam/page.tsx

// Chặn copy/paste
const preventCopy = (e: ClipboardEvent) => {
  e.preventDefault();
  return false;
};

// Phát hiện chuyển tab
const handleVisibilityChange = () => {
  if (document.hidden && !isSubmitting) {
    tabSwitchCount++;
    if (tabSwitchCount >= 3) {
      autoSubmitExam(); // Tự động nộp bài
    }
  }
};

// Giám sát fullscreen
const handleFullscreenChange = () => {
  if (!document.fullscreenElement) {
    fullscreenExitCount++;
    if (fullscreenExitCount >= 3) {
      autoSubmitExam(); // Tự động nộp bài
    }
  }
};
```

### ⚠️ Lưu ý

Các biện pháp anti-cheating hiện tại tập trung vào **client-side restrictions** cơ bản. Để tăng cường bảo mật, có thể bổ sung thêm:

- 📷 Camera monitoring (Proctoring)
- 🎥 Screen recording
- 🤖 AI behavior detection
- 📱 Multiple device detection
- 🌐 IP/Location tracking

---

## 🛠 Công nghệ sử dụng

### Backend

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Relational database
- **ORM**: [Prisma](https://www.prisma.io/) - Next-generation ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO - WebSocket communication
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

### Frontend

- **Framework**: [Next.js 14+](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios

### DevOps & Tools

- **Version Control**: Git & GitHub
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest (Unit), Playwright (E2E)

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Student   │  │   Teacher   │  │    Admin    │     │
│  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend (Port 3001)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │  Exams   │  │  Stats   │              │
│  │  Pages   │  │  Pages   │  │  Pages   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                         ↕ REST API
┌─────────────────────────────────────────────────────────┐
│                  NestJS Backend (Port 3000)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │  Exams   │  │  Users   │              │
│  │  Module  │  │  Module  │  │  Module  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Courses  │  │ Questions│  │   Stats  │              │
│  │  Module  │  │  Module  │  │  Module  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                         ↕ Prisma ORM
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  Users | Courses | Exams | Questions | Attempts         │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (đi kèm với Node.js)
- **PostgreSQL** >= 14.0 ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

---

## 📦 Cài đặt

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/EIU_TestLab.git
cd EIU_TestLab
```

### 2. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp .env.example .env

# Cấu hình database trong file .env
# DATABASE_URL="postgresql://user:password@localhost:5432/eiu_testlab"
# JWT_SECRET="your-secret-key"

# Chạy migrations
npx prisma migrate dev

# Seed dữ liệu mẫu (optional)
npm run seed
```

### 3. Cài đặt Frontend

```bash
# Quay lại thư mục root
cd ..

# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env.local
cp .env.example .env.local

# Cấu hình API URL trong .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Chạy ứng dụng

#### Chạy Backend (Terminal 1)

```bash
cd backend
npm run start:dev
```

Backend sẽ chạy tại: `http://localhost:4000`  
API Documentation: `http://localhost:3000/api`

#### Chạy Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

---

## 📖 Hướng dẫn sử dụng

### 🔐 Đăng nhập

1. Truy cập `http://localhost:3000`
2. Nhập username và password
3. Hệ thống tự động chuyển đến dashboard tương ứng với role

### 👨‍🎓 Sinh viên

#### Làm bài thi

1. Vào **"My Exams"** để xem danh sách bài thi
2. Click vào bài thi muốn làm
3. Đọc kỹ hướng dẫn và click **"Start Exam"**
4. Làm bài trong thời gian quy định
5. Click **"Submit"** khi hoàn thành

#### Xem kết quả

1. Vào **"My Results"**
2. Click vào bài thi đã làm để xem chi tiết
3. Xem điểm số, đáp án đúng/sai (nếu được phép)

### 👨‍🏫 Giảng viên

#### Tạo đề thi thủ công

1. Vào **"Create Exam"**
2. Điền thông tin đề thi (tên, môn học, thời gian, v.v.)
3. Thêm câu hỏi từ question bank hoặc tạo mới
4. Preview và Publish

#### Import đề thi từ Markdown

1. Vào **"Create Exam"** → **"Import from Markdown"**
2. Upload file `.md` hoặc paste nội dung
3. Preview các câu hỏi được import
4. Chỉnh sửa nếu cần và click **"Import"**

**Định dạng Markdown mẫu:**

```markdown
# Đề thi Lập trình Web

**Môn học:** Web Development
**Thời gian:** 90 phút
**Tổng điểm:** 10

## Câu 1: HTML là viết tắt của gì?
**Loại:** multiple-choice
**Điểm:** 1

- A. HyperText Markup Language
- B. HyperText Modern Language
- C. HyperLink Markup Language
- D. HyperLink Modern Language

**Đáp án:** A
```

#### Xem kết quả sinh viên

1. Vào **"Results"** hoặc **"Statistics"**
2. Chọn môn học và bài thi
3. Xem danh sách sinh viên đã làm bài
4. Click vào từng sinh viên để xem chi tiết
5. Export kết quả nếu cần

---

## 🔧 API Documentation

Hệ thống cung cấp RESTful API đầy đủ. Chi tiết API documentation có thể truy cập tại:

👉 **Swagger UI**: `http://localhost:3000/api`

### Authentication Endpoints

```http
POST   /auth/login           # Đăng nhập
POST   /auth/register         # Đăng ký (student only)
POST   /auth/refresh          # Refresh token
GET    /auth/profile          # Lấy thông tin user
```

### User Management

```http
GET    /users                 # Lấy danh sách users (Admin)
POST   /users                 # Tạo user mới (Admin)
GET    /users/:id             # Lấy thông tin user
PUT    /users/:id             # Cập nhật user
DELETE /users/:id             # Xóa user (Admin)
POST   /users/import-csv      # Import sinh viên từ CSV (Admin)
```

### Courses

```http
GET    /courses               # Lấy danh sách môn học
POST   /courses               # Tạo môn học (Teacher/Admin)
GET    /courses/:id           # Chi tiết môn học
PUT    /courses/:id           # Cập nhật môn học
DELETE /courses/:id           # Xóa môn học
GET    /courses/:id/students  # Danh sách sinh viên trong môn
```

### Exams

```http
GET    /exams                 # Lấy danh sách đề thi
POST   /exams                 # Tạo đề thi (Teacher)
POST   /exams/import-markdown # Import từ Markdown
GET    /exams/:id             # Chi tiết đề thi
PUT    /exams/:id             # Cập nhật đề thi
DELETE /exams/:id             # Xóa đề thi
GET    /exams/:id/start       # Bắt đầu làm bài
POST   /exams/:id/submit      # Nộp bài thi
```

### Questions

```http
GET    /questions             # Lấy danh sách câu hỏi
POST   /questions             # Tạo câu hỏi
GET    /questions/:id         # Chi tiết câu hỏi
PUT    /questions/:id         # Cập nhật câu hỏi
DELETE /questions/:id         # Xóa câu hỏi
```

### Attempts & Results

```http
GET    /attempts              # Lấy danh sách attempts
GET    /attempts/:id          # Chi tiết attempt
POST   /attempts/:id/answers  # Lưu câu trả lời
GET    /results/:examId       # Kết quả theo exam
GET    /results/student/:id   # Kết quả của sinh viên
```

### Statistics

```http
GET    /stats/overview        # Thống kê tổng quan (Admin)
GET    /stats/courses/:id     # Thống kê theo môn học
GET    /stats/exams/:id       # Thống kê theo đề thi
GET    /stats/students/:id    # Thống kê theo sinh viên
```

### Real-time Events (WebSocket)

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Events
socket.on('notification', (data) => { /* ... */ });
socket.on('exam:started', (data) => { /* ... */ });
socket.on('exam:warning', (data) => { /* ... */ });
socket.on('exam:submitted', (data) => { /* ... */ });
```

---

## 👥 Tài khoản demo

Sau khi seed dữ liệu, bạn có thể sử dụng các tài khoản sau để test:

### 👨‍💼 Admin

| Username | Password | Họ tên |
|----------|----------|--------|
| `admin` | `12345678` | System Administrator |

### 👨‍🏫 Giảng viên (Teachers)

| Username | Password | Họ tên | Email |
|----------|----------|--------|-------|
| `teacher1` | `12345678` | PGS.TS Nguyễn Văn C | nguyenvanc@eiu.edu.vn |

### 👨‍🎓 Sinh viên (Students)

| Username | Password | Họ tên | MSSV |
|----------|----------|--------|------|
| `student1` | `12345678` | Nguyễn Văn A | 2021001 |

> **Lưu ý**: Đổi password ngay sau khi đăng nhập lần đầu trong môi trường production.

---

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng làm theo các bước sau:

### 1. Fork Repository

Click nút "Fork" ở góc trên bên phải của repository.

### 2. Clone Fork của bạn

```bash
git clone https://github.com/your-username/EIU_TestLab.git
cd EIU_TestLab
```

### 3. Tạo Branch mới

```bash
git checkout -b feature/amazing-feature
```

### 4. Commit Changes

```bash
git add .
git commit -m "Add some amazing feature"
```

### 5. Push to Branch

```bash
git push origin feature/amazing-feature
```

### 6. Tạo Pull Request

Mở Pull Request trên GitHub và mô tả chi tiết về changes của bạn.

### 📝 Coding Guidelines

- Sử dụng TypeScript cho tất cả code mới
- Follow ESLint và Prettier configurations
- Viết unit tests cho features mới
- Update documentation khi cần
- Commit messages theo [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🐛 Bug Reports & Feature Requests

Nếu bạn tìm thấy bug hoặc có ý tưởng cho tính năng mới:

1. Kiểm tra [Issues](https://github.com/yourusername/EIU_TestLab/issues) xem có ai report chưa
2. Nếu chưa, tạo [New Issue](https://github.com/yourusername/EIU_TestLab/issues/new)
3. Mô tả chi tiết vấn đề/ý tưởng
4. Thêm labels phù hợp (bug, enhancement, documentation, etc.)

---

## 📄 License

Dự án này được phát hành dưới **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 🙏 Acknowledgments

- [Eastern International University](https://eiu.edu.vn) - Đại học Quốc tế Miền Đông
- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://www.prisma.io/) - Database ORM

---

## 📞 Liên hệ

- **Email**: an.tranquoc.cit22@eiu.edu.vn

---

<div align="center">

**⭐ Nếu project này hữu ích, đừng quên cho chúng tôi một Star! ⭐**

Made with ❤️ for Eastern International University

[🔝 Back to top](#-eiu-testlab)

</div>
