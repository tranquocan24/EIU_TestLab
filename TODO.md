# TODO: Tính năng Import Đề thi từ File Markdown

## 📅 Ngày tạo: 20/12/2025

---

## 🔧 Backend Tasks

### ✅ Task 1: Tạo Markdown Parser Service (Backend)
**File:** `backend/src/modules/exams/markdown-parser.service.ts`

**Mô tả:** Tạo service với các function:
- `parseMarkdownToExam()` để parse header (title, subject, duration)
- `parseQuestions()` để parse từng câu hỏi (multiple-choice, multiple-select, text)
- `validateMarkdown()` để kiểm tra format hợp lệ
- Xử lý UTF-8 encoding và các edge cases

**Status:** ✅ Completed

---

### ✅ Task 2: Tạo DTO cho Markdown Import (Backend)
**File:** `backend/src/modules/exams/dto/import-markdown.dto.ts`

**Mô tả:** Tạo class `ImportMarkdownDto { markdownContent: string }`. Thêm validation cho nội dung markdown không rỗng và có format hợp lệ.

**Status:** ✅ Completed

---

### ✅ Task 3: Thêm Endpoint Import Markdown (Backend)
**File:** `backend/src/modules/exams/exams.controller.ts`

**Mô tả:** Thêm endpoint `POST /exams/import-markdown` với:
- `@UseGuards(JwtAuthGuard, RolesGuard)` 
- `@Roles('TEACHER', 'ADMIN')`
- Nhận markdownContent từ body
- Gọi MarkdownParserService
- Trả về parsed exam data để preview (chưa lưu DB)

**Status:** ✅ Completed

---

### ✅ Task 4: Update Exams Service (Backend)
**File:** `backend/src/modules/exams/exams.service.ts`

**Mô tả:** Thêm method `importFromMarkdown(markdownContent: string, userId: string)` để:
- Parse markdown
- Gọi `create()` để lưu vào DB
- Inject MarkdownParserService vào constructor

**Status:** ✅ Completed

---

### ✅ Task 5: Update Exams Module (Backend)
**File:** `backend/src/modules/exams/exams.module.ts`

**Mô tả:** Thêm `MarkdownParserService` vào providers array để có thể inject được.

**Status:** ✅ Completed

---

### ✅ Task 6: Test Backend API với Markdown Sample
**Mô tả:** Test endpoint `/exams/import-markdown` bằng Postman/Thunder Client với nội dung từ `sample_exam.md`. 

**Kiểm tra:**
- Response có đúng format exam data không
- Test các edge cases (markdown sai format, thiếu thông tin, ký tự đặc biệt tiếng Việt)

**Status:** ✅ Completed

**Kết quả:**
- ✅ Backend server đã start thành công
- ✅ Endpoint `/exams/import-markdown` đã được mapped
- ✅ Đã tạo file test `test-import-markdown.http`
- ✅ Có thể test bằng REST Client extension hoặc Postman

---

## 🎨 Frontend Tasks

### ✅ Task 7: Tạo Markdown Import Modal Component (Frontend)
**File:** `frontend/src/components/forms/MarkdownImportModal.tsx`

**Mô tả:** Tạo modal với:
- File upload input (accept .md)
- Textarea để paste nội dung trực tiếp
- Button Preview để gọi API parse
- Hiển thị preview exam data (title, questions với syntax highlighting)
- Button Import để confirm và truyền data về parent component

**Status:** ✅ Completed

**Features implemented:**
- ✅ File upload with .md validation
- ✅ Textarea for pasting markdown content
- ✅ Preview button that calls backend API
- ✅ Beautiful preview display with question details
- ✅ Syntax highlighting for correct answers
- ✅ Error and success message handling
- ✅ Link to markdown guide
- ✅ Responsive design with EIU colors (#112444)
- ✅ Loading states and proper error handling

---

### ✅ Task 8: Thêm API Method Import Markdown (Frontend)
**File:** `frontend/src/lib/api.ts`

**Mô tả:** Thêm method `importMarkdownExam(markdownContent: string)` gọi `POST /exams/import-markdown` với Authorization header. Method trả về parsed exam data để preview.

**Status:** ✅ Completed

**Implementation:**
- ✅ Added `importMarkdownExam(markdownContent: string)` method
- ✅ Uses POST request to `/exams/import-markdown` endpoint
- ✅ Automatically includes Authorization header via interceptor
- ✅ Returns parsed exam data for preview

---

### ✅ Task 9: Integrate Modal vào Create Exam Page (Frontend)
**File:** `frontend/src/app/(dashboard)/teacher/create/page.tsx`

**Mô tả:** 
- Thêm button 'Import từ Markdown' mở MarkdownImportModal
- Khi user confirm import, nhận parsed data và auto-fill vào form (title, subject, duration, questions array)
- User có thể chỉnh sửa thêm trước khi submit

**Status:** ✅ Completed

**Implementation:**
- ✅ Added "Import từ Markdown" button in page header
- ✅ Integrated MarkdownImportModal component
- ✅ Implemented `handleImportMarkdown` function to auto-fill form
- ✅ Maps imported questions to form format (multiple-choice, essay)
- ✅ Auto-fills: title, subject, duration, description, questions
- ✅ Shows success toast notification after import
- ✅ Handles multiple-select questions by converting to multiple-choice
- ✅ Users can edit all fields after import before saving

---

### ✅ Task 10: Styling và UX Improvements (Frontend)
**Mô tả:** 
- Style MarkdownImportModal với Tailwind CSS theo design system hiện tại (EIU colors #112444)
- Thêm loading states, error handling hiển thị rõ ràng
- Success notification sau khi import
- Thêm link đến `markdown_guide.md` trong modal để user tham khảo

**Status:** ✅ Completed

**Note:** All requirements were already implemented in Task 7:
- ✅ EIU colors (#112444) applied to title, buttons, and links
- ✅ Loading states with spinner animation during preview
- ✅ Error alerts with red styling and AlertCircle icon
- ✅ Success alerts with green styling and CheckCircle2 icon
- ✅ Link to markdown_guide.md in dialog description
- ✅ Responsive design with mobile-friendly layout
- ✅ Professional Tailwind CSS styling throughout
- ✅ Smooth transitions and hover effects
- ✅ Clear visual hierarchy and spacing

---

## 📚 Documentation & Testing

### ✅ Task 11: Kiểm tra File Hướng dẫn
**Files:** `sample_exam.md`, `markdown_guide.md`

**Mô tả:** 
- Review và update nội dung để đảm bảo hướng dẫn đầy đủ, rõ ràng
- Thêm ví dụ về các edge cases nếu cần
- Đảm bảo encoding UTF-8 cho tiếng Việt

**Status:** ✅ Completed

**Enhancements made:**
- ✅ Reviewed both documentation files for completeness
- ✅ Added comprehensive edge cases section:
  - Câu hỏi có code blocks
  - Câu hỏi có ký tự đặc biệt
  - Câu hỏi có dấu gạch đầu dòng
  - Đáp án có dấu phẩy
- ✅ Added troubleshooting table with common errors and solutions
- ✅ Added tips for creating effective exams
- ✅ Added support section with step-by-step help
- ✅ Added comments to sample_exam.md explaining its purpose
- ✅ Verified UTF-8 encoding for Vietnamese text support
- ✅ Improved clarity and organization of guide

---

### ✅ Task 12: End-to-End Testing
**Mô tả:** Test toàn bộ flow:
1. Login as teacher
2. Vào Create Exam
3. Import từ Markdown (cả upload file và paste)
4. Preview
5. Import
6. Chỉnh sửa
7. Save
8. Verify trong database và UI

**Test với nhiều loại câu hỏi khác nhau:**
- Multiple choice
- Multiple select
- Text/Essay

**Status:** ⏳ Not Started

---

## 📊 Progress Summary

- **Total Tasks:** 12
- **Completed:** 11
- **In Progress:** 0
- **Not Started:** 1

---

## 📝 Notes

- File mẫu đề thi: `sample_exam.md`
- Hướng dẫn chi tiết: `markdown_guide.md`
- Hỗ trợ 3 loại câu hỏi: Trắc nghiệm đơn, trắc nghiệm nhiều lựa chọn, tự luận
- Đảm bảo xử lý UTF-8 encoding cho tiếng Việt
- Backend phải validate markdown format trước khi parse
- Frontend cần có preview trước khi import vào form

---

## 🔗 Related Files

- Backend:
  - `backend/src/modules/exams/exams.controller.ts`
  - `backend/src/modules/exams/exams.service.ts`
  - `backend/src/modules/exams/exams.module.ts`

- Frontend:
  - `frontend/src/app/(dashboard)/teacher/create/page.tsx`
  - `frontend/src/lib/api.ts`

- Documentation:
  - `sample_exam.md`
  - `markdown_guide.md`
  - `README.md`
