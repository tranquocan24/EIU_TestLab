# Kế Hoạch Tạo Báo Cáo Dự Án - CSE310 TestLab Online Exam System

## 📋 Tổng Quan
Tài liệu này mô tả chi tiết từng bước để hoàn thành báo cáo dự án TestLab - Hệ thống thi trực tuyến.

---

## 0. ABSTRACT

**ABSTRACT**

This project presents the development of **EIU TestLab**, a comprehensive web-based examination platform designed for Eastern International University (EIU). The system provides a complete digital solution for educators to create, manage, and conduct online examinations while enabling students to participate in secure, interactive assessments seamlessly.

EIU TestLab is built on a modern **microservices architecture** utilizing **NestJS** (Node.js framework) for the backend and **Next.js 14** (React framework) for the frontend. The system employs **PostgreSQL** as the relational database management system with **Prisma ORM** for efficient data modeling and type-safe database operations, ensuring robust data integrity and scalability.

**Key technological features** include:
- **Full-stack TypeScript** implementation for type safety and maintainable codebase
- **RESTful API architecture** with comprehensive endpoint design for all operations
- **Real-time communication** via **Socket.IO** for instant notifications and live messaging
- **JWT-based authentication** with role-based access control (Student, Teacher, Admin)
- **Responsive UI** powered by **Tailwind CSS** and **Shadcn/ui** component library
- **State management** using Zustand for optimized client-side performance

**Core functionalities** encompass multi-role user management, dynamic exam creation with multiple question types (multiple choice, multiple selection, text/code responses), and innovative **Markdown-based question import** capabilities for streamlined exam preparation. The system features automatic grading for objective questions, real-time exam attempt tracking with auto-save mechanisms, comprehensive statistical analysis and reporting dashboards, and email notification services for important events.

**Security and reliability** are prioritized through enterprise-grade authentication mechanisms, password hashing with bcrypt, session management, CORS configuration, input validation and sanitization, and database transaction management for data consistency.

The platform demonstrates the practical application of **Software Engineering principles** and modern web development best practices, including modular architecture with separation of concerns, DTO (Data Transfer Objects) pattern for API contracts, service-oriented design, dependency injection, and environment-based configuration management.

This project delivers to EIU a **production-ready, scalable, and maintainable** online examination system that significantly enhances the digital learning experience. The architecture supports future extensibility, performance optimization, and integration with additional educational tools, positioning EIU TestLab as a sustainable solution for modern academic assessment needs.

**Keywords:** Online Examination System, NestJS, Next.js, TypeScript, Prisma ORM, PostgreSQL, Real-time Communication, Educational Technology, Web Development, Software Engineering

---

## ACKNOWLEDGEMENT

First, I would like to express my sincere gratitude to my supervisor, **Mr. Hà Minh Ngọc**, for his patient guidance, valuable feedback, and continuous support throughout this project. His professional advice and constructive criticism have been instrumental in both my learning process and the successful completion of this work. His expertise and mentorship have greatly enhanced the quality of this project.

I am also deeply indebted to the faculty and staff of the **School of Computing and Information Technology, Eastern International University**, for creating a supportive and stimulating academic environment. The facilities, resources, and technical support provided have been essential to conducting this research and development work.

Special thanks go to my fellow team members for their collaboration, dedication, and mutual support throughout the development lifecycle. Their contributions in various aspects of the project—from design and implementation to testing and documentation—have been invaluable.

I would also like to acknowledge the open-source community and the developers of NestJS, Next.js, Prisma, and other technologies used in this project. Their excellent documentation and community support have significantly facilitated the development process.

Finally, I extend my heartfelt appreciation to my family and friends for their unwavering encouragement, understanding, and moral support during the entire course of this project.

This project would not have been possible without the collective support and contributions of all these individuals and institutions.

---

## 1. TRANG BÌA VÀ MỤC LỤC

### 1.1 Trang bìa
- [ ] Thêm logo trường (EIU)
- [ ] Tiêu đề dự án: "CSE310 TestLab - Online Exam System"
- [ ] Thông tin môn học: CSE310 - Software Engineering
- [ ] Họ tên thành viên nhóm và MSSV
- [ ] Tên giảng viên hướng dẫn
- [ ] Học kỳ và năm học
- [ ] Ngày nộp báo cáo

### 1.2 Mục lục
- [ ] Liệt kê tất cả các chương, mục, mục con
- [ ] Đánh số trang chính xác
- [ ] Danh sách hình ảnh (nếu có)
- [ ] Danh sách bảng biểu (nếu có)

---

## 2. OVERVIEW

### 2.1 Introduction

Traditional paper-based examination systems, while familiar and time-tested, present numerous challenges in today's digital age. These include logistical complexities in exam distribution and collection, time-consuming manual grading processes, difficulties in maintaining exam security, limited flexibility in question formats, environmental concerns related to paper usage, and challenges in providing immediate feedback to students. Furthermore, the COVID-19 pandemic has highlighted the urgent need for robust online assessment platforms that can ensure academic continuity while maintaining the integrity and reliability of the examination process.

**EIU TestLab** represents a comprehensive solution designed to address these challenges by providing a modern, web-based examination platform tailored specifically for Eastern International University. The system is architected using cutting-edge web technologies including **NestJS** (Node.js framework) for the backend, **Next.js 14** (React framework) for the frontend, and **PostgreSQL** with **Prisma ORM** for reliable data management, ensuring optimal performance, scalability, and maintainability without the complexity often associated with heavy framework dependencies.

The platform serves multiple user roles within the university ecosystem, primarily focusing on three key stakeholders: **administrators**, **educators** (teachers and professors), and **students**. For educators, the system provides powerful tools for creating diverse examination formats, managing question banks through innovative **Markdown import functionality**, monitoring exam progress in real-time, and analyzing student performance through comprehensive analytics. For students, the platform offers an intuitive interface for accessing assigned examinations, completing assessments within specified timeframes, and reviewing their performance and feedback. For administrators, the system enables centralized user management, system monitoring, and institutional oversight.

### 2.2 Objectives

The primary objective of this project is to develop **EIU TestLab**, a comprehensive web-based online examination system specifically designed for Eastern International University. This system aims to modernize the university's assessment processes by providing a secure, efficient, and user-friendly platform that serves all stakeholders in the academic community.

#### Key Objectives:

**1. Develop a Multi-Role Online Examination Platform**
- Create secure user authentication and role-based access control for students, teachers, and administrators using **JWT tokens** and **bcrypt** password hashing
- Implement intuitive user interfaces tailored for different user roles with responsive design
- Ensure system reliability and high performance during examination periods with support for concurrent users
- Provide real-time updates using **Socket.IO** for instant notifications and live messaging

**2. Advanced Question Management and Exam Creation**
- Support multiple question types: multiple-choice, multiple-selection, text responses, and code questions
- Implement innovative **Markdown import functionality** for rapid question development and bulk question addition
- Provide flexible exam scheduling with specific start/end times and duration management
- Enable exam configuration with customizable parameters (duration, scoring, visibility, publishing)

**3. Automated Assessment and Result Management**
- Develop automatic scoring system for objective questions (multiple-choice and multiple-selection)
- Create comprehensive result tracking with detailed score breakdowns and performance analytics
- Enable immediate feedback delivery to students upon exam submission
- Provide statistical analysis and reporting dashboards for educators and administrators

**4. Technical Excellence and Security**
- Build robust architecture using **NestJS** microservices with **TypeScript** for type safety
- Implement **PostgreSQL** database with **Prisma ORM** for reliable, scalable data storage
- Ensure responsive design compatible across desktop, tablet, and mobile devices using **Tailwind CSS** and **Shadcn/ui**
- Maintain high security standards with CORS configuration, input validation, and database transaction management
- Implement auto-save mechanism to prevent data loss during examinations

**5. Educational Impact and Efficiency**
- Reduce administrative burden on educators through automation of grading and result processing
- Minimize operational costs associated with traditional paper-based examinations (printing, distribution, storage)
- Support the university's digital transformation and sustainability initiatives
- Provide data-driven insights for academic decision-making through comprehensive analytics
- Enable remote and hybrid learning models with accessible online assessments

### 2.3 Related Works

In building EIU TestLab, we examined several existing online testing systems to understand their capabilities, identify best practices, and determine areas for improvement.

#### 2.3.1 Moodle
**Moodle** is a well-known open-source Learning Management System (LMS) that supports comprehensive examination features, including question banks, various question types, automated grading, and detailed analytics. It is a powerful and mature platform with extensive plugin ecosystems.

**Strengths:**
- Comprehensive LMS functionality beyond just examinations
- Large community support and extensive documentation
- Highly customizable with numerous plugins
- Support for multiple question types and grading methods

**Limitations:**
- Can feel heavy and complex, especially for institutions that only need testing features
- Steep learning curve for both administrators and end-users
- Resource-intensive, requiring significant server infrastructure
- User interface can be outdated and less intuitive compared to modern web applications

#### 2.3.2 Google Forms
**Google Forms** is widely used for quick quizzes, surveys, and simple assessments. It integrates seamlessly with Google Workspace and allows automatic scoring of objective questions with easy sharing and collaboration features.

**Strengths:**
- Extremely easy to use with minimal setup required
- Free and readily accessible to anyone with a Google account
- Real-time response collection and basic analytics
- Seamless integration with Google Sheets for data export

**Limitations:**
- Lacks advanced security features required for high-stakes examinations
- Limited question type support and formatting options
- No exam-specific features like time limits, question randomization, or proctoring
- Insufficient analytics and reporting for academic assessment needs
- Not designed for institutional-scale deployment with role-based access control

#### 2.3.3 Azota
**Azota** (azota.vn) is an online examination platform designed specifically for schools and teachers in Vietnam. It provides convenient test creation, automatic scoring, attendance tracking, and mobile-friendly interfaces.

**Strengths:**
- User-friendly interface tailored for Vietnamese educational context
- Quick test creation with intuitive workflows
- Automatic scoring and immediate result delivery
- Popular among K-12 educators for its simplicity

**Limitations:**
- Primarily designed for K-12 education, not optimized for higher education complexity
- Limited scalability and role-specific management required in university contexts
- Less comprehensive analytics and reporting compared to enterprise LMS solutions
- Restricted customization options for institutional branding and workflows

#### 2.3.4 Comparative Analysis and EIU TestLab's Unique Value

From these platforms, common features include exam creation, question management, automated grading, and basic reporting. However, each has significant gaps that EIU TestLab addresses:

**EIU TestLab's Differentiation:**

1. **Modern Technology Stack**: Unlike Moodle's older architecture, EIU TestLab uses cutting-edge technologies (NestJS, Next.js 14, TypeScript) providing better performance, maintainability, and developer experience.

2. **Purpose-Built for Higher Education**: While Google Forms is too simple and Azota targets K-12, EIU TestLab is specifically designed for university-level assessment needs with appropriate complexity and features.

3. **Markdown-Based Question Import**: A unique feature not found in most platforms, allowing educators to rapidly create and import questions using familiar Markdown syntax, significantly reducing exam preparation time.

4. **Focused Functionality**: Instead of offering every possible LMS feature like Moodle, EIU TestLab focuses on what university teachers and students need most: easy exam setup, secure participation, clear results, and comprehensive analytics.

5. **Real-Time Features**: Built-in Socket.IO integration provides instant notifications, live messaging, and real-time monitoring capabilities that are either absent or poorly implemented in competing solutions.

6. **Security and Scalability**: Enterprise-grade security with JWT authentication, role-based access control, and PostgreSQL database ensures both security and scalability for university-wide deployment.

7. **Responsive Modern UI**: Clean, intuitive interface built with Tailwind CSS and Shadcn/ui components, providing superior user experience compared to older platforms.

8. **Open Architecture**: Modular microservices design allows easy extension and integration with other university systems, providing flexibility for future enhancements.

By learning from existing solutions and addressing their limitations, EIU TestLab delivers a focused, modern, and efficient online examination platform that meets the specific needs of Eastern International University while remaining scalable and maintainable for future growth.

---

## 3. PHÂN TÍCH YÊU CẦU

### 3.1 Yêu cầu chức năng

#### 3.1.1 Module Quản lý Người dùng (Users)
- [ ] Đăng ký, đăng nhập, đăng xuất
- [ ] Phân quyền: Student, Teacher, Admin
- [ ] Quản lý profile cá nhân
- [ ] Xác thực và bảo mật (JWT, password hashing)

#### 3.1.2 Module Quản lý Bài thi (Exams)
- [ ] Tạo bài thi mới (giáo viên)
- [ ] Import câu hỏi từ Markdown
- [ ] Thiết lập thời gian, số câu hỏi, điểm số
- [ ] Xuất bản/ẩn bài thi
- [ ] Xem danh sách bài thi

#### 3.1.3 Module Quản lý Câu hỏi (Questions)
- [ ] Tạo câu hỏi trắc nghiệm (Multiple Choice)
- [ ] Tạo câu hỏi tự luận (Text/Code)
- [ ] Hỗ trợ nhiều loại câu hỏi
- [ ] Quản lý đáp án đúng
- [ ] Phân loại câu hỏi theo độ khó

#### 3.1.4 Module Làm bài thi (Attempts)
- [ ] Học sinh truy cập bài thi
- [ ] Đếm ngược thời gian
- [ ] Lưu tự động câu trả lời
- [ ] Nộp bài thi
- [ ] Chống gian lận (timer, một lần làm)

#### 3.1.5 Module Chấm điểm và Kết quả
- [ ] Chấm điểm tự động (trắc nghiệm)
- [ ] Hiển thị kết quả cho học sinh
- [ ] Xem đáp án chi tiết (sau khi nộp)
- [ ] Giáo viên xem kết quả lớp

#### 3.1.6 Module Thống kê (Stats)
- [ ] Thống kê điểm trung bình
- [ ] Biểu đồ phân bố điểm
- [ ] Thống kê theo bài thi
- [ ] Dashboard cho giáo viên/admin

#### 3.1.7 Module Thông báo (Notifications)
- [ ] Gửi email thông báo
- [ ] Thông báo trong hệ thống
- [ ] Thông báo real-time (Socket.IO)

#### 3.1.8 Module Tin nhắn (Messages)
- [ ] Chat giữa học sinh và giáo viên
- [ ] Real-time messaging
- [ ] Lịch sử tin nhắn

### 3.2 Yêu cầu phi chức năng
- [ ] Hiệu năng: Phản hồi < 2 giây
- [ ] Bảo mật: Mã hóa dữ liệu, JWT authentication
- [ ] Khả năng mở rộng: Microservices architecture
- [ ] Tính sẵn sàng: Uptime > 99%
- [ ] Giao diện: Responsive, dễ sử dụng
- [ ] Cross-browser compatibility

### 3.3 Use Case Diagrams
- [ ] Vẽ Use Case cho Student
- [ ] Vẽ Use Case cho Teacher
- [ ] Vẽ Use Case cho Admin
- [ ] Mô tả chi tiết từng Use Case chính

---

## 4. THIẾT KẾ HỆ THỐNG

### 4.1 Kiến trúc hệ thống

#### 4.1.1 Tổng quan kiến trúc
- [ ] Vẽ sơ đồ kiến trúc tổng thể (Frontend - Backend - Database)
- [ ] Mô tả Client-Server architecture
- [ ] Giải thích RESTful API
- [ ] WebSocket cho real-time features

#### 4.1.2 Tech Stack
**Frontend:**
- [ ] Next.js 14 (React framework)
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] Shadcn/ui components
- [ ] Zustand (state management)
- [ ] Socket.IO client

**Backend:**
- [ ] NestJS (Node.js framework)
- [ ] TypeScript
- [ ] Prisma ORM
- [ ] PostgreSQL
- [ ] JWT authentication
- [ ] Socket.IO server
- [ ] Nodemailer (email)

**DevOps:**
- [ ] Git (version control)
- [ ] Docker (containerization)
- [ ] Environment variables management

### 4.2 Database Design

#### 4.2.1 ER Diagram
- [ ] Vẽ ER Diagram đầy đủ
- [ ] Xác định các Entity chính
- [ ] Xác định Relationships
- [ ] Xác định Cardinality

#### 4.2.2 Database Schema
- [ ] Table: User
  - Cột: id, email, password, role, fullName, studentId, createdAt, updatedAt
- [ ] Table: Exam
  - Cột: id, title, description, duration, startTime, endTime, isPublished, teacherId, courseId
- [ ] Table: Question
  - Cột: id, examId, type, content, options, correctAnswer, points
- [ ] Table: Attempt
  - Cột: id, examId, studentId, startedAt, submittedAt, score, answers
- [ ] Table: Course
  - Cột: id, name, code, description, teacherId
- [ ] Table: Enrollment
  - Cột: id, studentId, courseId, enrolledAt
- [ ] Table: Message
  - Cột: id, senderId, receiverId, content, timestamp
- [ ] Table: Notification
  - Cột: id, userId, type, content, isRead, createdAt

#### 4.2.3 Constraints và Indexes
- [ ] Primary Keys
- [ ] Foreign Keys
- [ ] Unique constraints
- [ ] Indexes cho performance
- [ ] Cascading rules

### 4.3 API Design

#### 4.3.1 Authentication APIs
- [ ] POST /auth/register - Đăng ký
- [ ] POST /auth/login - Đăng nhập
- [ ] POST /auth/logout - Đăng xuất
- [ ] GET /auth/profile - Lấy thông tin user
- [ ] PUT /auth/profile - Cập nhật profile

#### 4.3.2 Exam APIs
- [ ] GET /exams - Danh sách bài thi
- [ ] GET /exams/:id - Chi tiết bài thi
- [ ] POST /exams - Tạo bài thi mới (Teacher)
- [ ] PUT /exams/:id - Cập nhật bài thi
- [ ] DELETE /exams/:id - Xóa bài thi
- [ ] POST /exams/import-markdown - Import từ Markdown

#### 4.3.3 Question APIs
- [ ] GET /questions/exam/:examId - Lấy câu hỏi của bài thi
- [ ] POST /questions - Tạo câu hỏi mới
- [ ] PUT /questions/:id - Cập nhật câu hỏi
- [ ] DELETE /questions/:id - Xóa câu hỏi

#### 4.3.4 Attempt APIs
- [ ] POST /attempts - Bắt đầu làm bài
- [ ] GET /attempts/:id - Lấy thông tin attempt
- [ ] PUT /attempts/:id/answer - Lưu câu trả lời
- [ ] POST /attempts/:id/submit - Nộp bài
- [ ] GET /attempts/student/:studentId - Lịch sử làm bài

#### 4.3.5 Stats APIs
- [ ] GET /stats/exam/:examId - Thống kê bài thi
- [ ] GET /stats/student/:studentId - Thống kê học sinh
- [ ] GET /stats/course/:courseId - Thống kê khóa học

#### 4.3.6 Notification & Message APIs
- [ ] GET /notifications - Danh sách thông báo
- [ ] PUT /notifications/:id/read - Đánh dấu đã đọc
- [ ] POST /messages - Gửi tin nhắn
- [ ] GET /messages/conversation/:userId - Lịch sử chat

### 4.4 UI/UX Design

#### 4.4.1 Wireframes
- [ ] Login page
- [ ] Student dashboard
- [ ] Teacher dashboard
- [ ] Admin dashboard
- [ ] Exam list page
- [ ] Exam taking page
- [ ] Result page
- [ ] Create exam page

#### 4.4.2 Mockups/Screenshots
- [ ] Chụp màn hình các trang chính
- [ ] Responsive design (desktop, tablet, mobile)
- [ ] Dark/Light theme (nếu có)

#### 4.4.3 User Flow
- [ ] Flow đăng nhập
- [ ] Flow làm bài thi (Student)
- [ ] Flow tạo bài thi (Teacher)
- [ ] Flow xem kết quả

---

## 5. TRIỂN KHAI (IMPLEMENTATION)

### 5.1 Cấu trúc thư mục dự án
- [ ] Liệt kê cấu trúc thư mục backend
- [ ] Liệt kê cấu trúc thư mục frontend
- [ ] Giải thích vai trò của từng thư mục/file chính

### 5.2 Backend Implementation

#### 5.2.1 Setup và Configuration
- [ ] Cài đặt NestJS
- [ ] Setup Prisma ORM
- [ ] Kết nối PostgreSQL
- [ ] Environment configuration
- [ ] CORS setup

#### 5.2.2 Modules chính
- [ ] AuthModule: JWT strategy, guards, decorators
- [ ] UsersModule: CRUD operations
- [ ] ExamsModule: Markdown parser service
- [ ] QuestionsModule: Question types handling
- [ ] AttemptsModule: Timer logic, auto-save
- [ ] StatsModule: Aggregation queries
- [ ] NotificationsModule: Email service
- [ ] MessagesModule: Socket.IO gateway

#### 5.2.3 Key Features Code Explanation
- [ ] JWT Authentication flow
- [ ] Markdown parser cho import câu hỏi
- [ ] Real-time notifications với Socket.IO
- [ ] Auto-save answers mechanism
- [ ] Grading algorithm

### 5.3 Frontend Implementation

#### 5.3.1 Setup và Configuration
- [ ] Next.js App Router
- [ ] TypeScript configuration
- [ ] Tailwind CSS setup
- [ ] Shadcn/ui components
- [ ] API client setup

#### 5.3.2 Components chính
- [ ] Layout components (Header, Footer, Navbar)
- [ ] Auth components (Login, Register)
- [ ] Exam components (ExamCard, ExamList, ExamTaking)
- [ ] Question components (MCQ, TextQuestion, CodeQuestion)
- [ ] Result components (ResultDisplay, ScoreChart)
- [ ] Notification components

#### 5.3.3 Pages
- [ ] Public pages: Login, Register
- [ ] Student pages: Dashboard, Exam List, Take Exam, Results
- [ ] Teacher pages: Dashboard, Create Exam, Manage Exams, View Results
- [ ] Admin pages: User Management, System Stats

#### 5.3.4 State Management
- [ ] Zustand stores (authStore, examStore)
- [ ] Custom hooks (useAuth, useSocket, useToast)

### 5.4 Real-time Features
- [ ] Socket.IO server setup
- [ ] Socket.IO client setup
- [ ] Real-time notifications
- [ ] Real-time messaging
- [ ] Connection handling

### 5.5 Code Snippets quan trọng
- [ ] Chọn 5-10 đoạn code quan trọng nhất
- [ ] Giải thích chi tiết từng đoạn code
- [ ] Highlight best practices

---

## 6. TESTING

### 6.1 Test Plan
- [ ] Xác định test strategy
- [ ] Test levels: Unit, Integration, E2E
- [ ] Test tools: Jest, Supertest, Cypress (nếu có)

### 6.2 Unit Testing
- [ ] Test các service chính
- [ ] Test utilities functions
- [ ] Test coverage report

### 6.3 Integration Testing
- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test authentication flow

### 6.4 User Acceptance Testing
- [ ] Test cases cho Student
- [ ] Test cases cho Teacher
- [ ] Test cases cho Admin
- [ ] Bug tracking và fixing

### 6.5 Test Results
- [ ] Tổng hợp kết quả test
- [ ] Screenshots test passed
- [ ] Bug report và resolution

---

## 7. DEPLOYMENT

### 7.1 Deployment Strategy
- [ ] Môi trường development
- [ ] Môi trường staging (nếu có)
- [ ] Môi trường production

### 7.2 Setup Production Environment
- [ ] Database setup (PostgreSQL)
- [ ] Backend deployment (Heroku/Railway/Vercel)
- [ ] Frontend deployment (Vercel/Netlify)
- [ ] Environment variables configuration
- [ ] Domain setup (nếu có)

### 7.3 Docker Configuration
- [ ] Dockerfile cho backend
- [ ] Dockerfile cho frontend
- [ ] docker-compose.yml
- [ ] Container orchestration

### 7.4 CI/CD Pipeline
- [ ] GitHub Actions (nếu có)
- [ ] Auto deploy workflow
- [ ] Build và test automation

---

## 8. KẾT QUẢ VÀ DEMO

### 8.1 Screenshots hệ thống
- [ ] Trang chủ
- [ ] Student dashboard với danh sách bài thi
- [ ] Trang làm bài thi (đang làm)
- [ ] Trang kết quả sau khi nộp
- [ ] Teacher dashboard
- [ ] Trang tạo bài thi mới
- [ ] Trang quản lý câu hỏi
- [ ] Trang xem kết quả lớp
- [ ] Admin dashboard
- [ ] Thống kê tổng quan

### 8.2 Video Demo
- [ ] Link video demo (YouTube/Drive)
- [ ] Thời lượng: 5-10 phút
- [ ] Nội dung: Demo toàn bộ tính năng chính

### 8.3 Live Demo
- [ ] URL hệ thống demo (nếu có deploy)
- [ ] Test accounts:
  - Admin: admin@testlab.com / password
  - Teacher: teacher@testlab.com / password
  - Student: student@testlab.com / password

---

## 9. ĐÁNH GIÁ VÀ RÚT KINH NGHIỆM

### 9.1 Đánh giá dự án
- [ ] Những gì đã hoàn thành tốt
- [ ] Những hạn chế còn tồn tại
- [ ] So sánh với mục tiêu ban đầu

### 9.2 Challenges và Solutions
- [ ] Vấn đề 1: Real-time synchronization
  - Giải pháp: Sử dụng Socket.IO
- [ ] Vấn đề 2: Markdown parsing
  - Giải pháp: Custom parser service
- [ ] Vấn đề 3: Timer accuracy
  - Giải pháp: Server-side validation
- [ ] Liệt kê 5-7 challenges chính

### 9.3 Lessons Learned
- [ ] Kinh nghiệm về teamwork
- [ ] Kinh nghiệm về technical skills
- [ ] Time management
- [ ] Best practices learned

### 9.4 Future Improvements
- [ ] Tính năng mở rộng trong tương lai
- [ ] Performance optimization
- [ ] Security enhancements
- [ ] UI/UX improvements
- [ ] Mobile app version

---

## 10. KẾT LUẬN

### 10.1 Tổng kết
- [ ] Tóm tắt dự án
- [ ] Đánh giá tổng thể
- [ ] Ý nghĩa của dự án

### 10.2 Đóng góp của từng thành viên
- [ ] Thành viên 1: Frontend + UI/UX
- [ ] Thành viên 2: Backend + Database
- [ ] Thành viên 3: Testing + Deployment
- [ ] Thành viên 4: Documentation + Project Management

---

## 11. PHỤ LỤC

### 11.1 Tài liệu tham khảo
- [ ] NestJS Documentation
- [ ] Next.js Documentation
- [ ] Prisma Documentation
- [ ] PostgreSQL Documentation
- [ ] Các bài báo/tutorial liên quan

### 11.2 Source Code
- [ ] GitHub repository link
- [ ] Cấu trúc branch
- [ ] Commit history summary

### 11.3 Database Schema SQL
- [ ] Full Prisma schema
- [ ] Migration files
- [ ] Seed data scripts

### 11.4 API Documentation
- [ ] Swagger/OpenAPI docs (nếu có)
- [ ] Postman collection
- [ ] API reference table

### 11.5 User Manual
- [ ] Hướng dẫn sử dụng cho Student
- [ ] Hướng dẫn sử dụng cho Teacher
- [ ] Hướng dẫn sử dụng cho Admin

---

## 📝 LƯU Ý QUAN TRỌNG

### Định dạng báo cáo
- Font chữ: Times New Roman, 12pt
- Line spacing: 1.5
- Margins: 2.5cm (trái), 2cm (phải, trên, dưới)
- Đánh số trang
- Heading styles nhất quán

### Nội dung
- Tổng số trang: 50-80 trang
- Hình ảnh/sơ đồ phải rõ ràng, có caption và số thứ tự
- Code snippets phải được format đẹp
- Tham khảo tài liệu phải đúng format (APA/IEEE)

### Checklist trước khi nộp
- [ ] Kiểm tra chính tả và ngữ pháp
- [ ] Đánh số trang chính xác
- [ ] Mục lục tự động cập nhật
- [ ] Tất cả hình ảnh hiển thị đúng
- [ ] Links và references hoạt động
- [ ] Export sang PDF
- [ ] File size hợp lý (< 50MB)

---

## 🎯 DEADLINE VÀ MILESTONE

- [ ] Week 1-2: Phần 1-3 (Giới thiệu, Phân tích yêu cầu)
- [ ] Week 3-4: Phần 4 (Thiết kế hệ thống)
- [ ] Week 5-8: Phần 5 (Implementation) - Hoàn thành code
- [ ] Week 9-10: Phần 6 (Testing)
- [ ] Week 11: Phần 7 (Deployment)
- [ ] Week 12: Phần 8-10 (Demo, Đánh giá, Kết luận)
- [ ] Week 13: Hoàn thiện, review, nộp báo cáo

---

**Last Updated:** December 21, 2025
**Project:** CSE310 TestLab - Online Exam System
**Team:** [Tên nhóm của bạn]
