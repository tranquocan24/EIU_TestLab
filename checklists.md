Hiện thực Hệ thống Giám sát thi (Proctoring) với Chunking Video & Supabase

  Role: Senior Fullstack Developer (NestJS + Next.js).
  Objective: Xây dựng hệ thống giám sát thi tự động bằng Webcam và Screen Recording. Hệ thống cần đảm bảo an toàn dữ liệu bằng cách chia nhỏ
  video (Chunking) và upload liên tục. Đặc biệt, giao diện giáo viên phải hỗ trợ xem lại các đoạn video này một cách
  liền mạch như đang xem một video duy nhất.

  ---

  ## TRẠNG THÁI THỰC HIỆN

  - [x] **Phase 1: Database & Configuration** ✅ HOÀN THÀNH
    - ✅ Cập nhật schema.prisma với trường `proctoringVideoPath`
    - ✅ Thêm SUPABASE_URL và SUPABASE_KEY vào .env.example
    - ✅ Chạy migration thành công

  - [x] **Phase 2: Backend (NestJS)** ✅ HOÀN THÀNH
    - ✅ ProctoringService với uploadChunk, getAttemptVideos, deleteAttemptVideos
    - ✅ ProctoringController với các endpoints
    - ✅ ProctoringModule đã đăng ký trong app.module.ts
    - ✅ DTOs cho upload và response

  - [x] **Phase 3: Frontend - Student (Next.js)** ✅ HOÀN THÀNH
    - ✅ WebcamRecorder component với video chunking (10 giây)
    - ✅ Retry mechanism (3 lần) với exponential backoff
    - ✅ Tích hợp vào trang thi (student/exam/page.tsx)
    - ✅ Auto-start khi bắt đầu thi, auto-stop khi nộp bài

  - [x] **Phase 4: Frontend - Teacher (Next.js)** ✅ HOÀN THÀNH
    - ✅ SeamlessVideoPlayer component với sequential playback
    - ✅ Preloading chunks để giảm buffer
    - ✅ Tích hợp vào trang xem kết quả (teacher/results/[id]/page.tsx)
    - ✅ UI controls: play/pause, progress bar, fullscreen

  - [x] **Phase 5: Supabase Setup** ✅ HOÀN THÀNH
    - ✅ Tài liệu hướng dẫn tạo Bucket (docs/PROCTORING_SETUP.md)
    - ✅ Cấu hình RLS policies
    - ✅ Cài đặt @supabase/supabase-js

  - [x] **Phase 6: Screen Recording** ✅ HOÀN THÀNH
    - ✅ ScreenRecorder component với screen capture API
    - ✅ Backend endpoints cho screen recording upload/playlist
    - ✅ ProctoringViewer để xem cả webcam và màn hình
    - ✅ Tích hợp vào trang thi (song song với webcam)

  ---

  ## FILES ĐƯỢC TẠO/SỬA ĐỔI

  **Backend:**
  - `backend/prisma/schema.prisma` - Thêm proctoringVideoPath field
  - `backend/src/modules/proctoring/proctoring.service.ts` - Core Supabase service (webcam + screen)
  - `backend/src/modules/proctoring/proctoring.controller.ts` - REST API endpoints (webcam + screen)
  - `backend/src/modules/proctoring/proctoring.module.ts` - NestJS module
  - `backend/src/modules/proctoring/dto/` - DTOs
  - `backend/src/app.module.ts` - Đăng ký ProctoringModule
  - `backend/.env.example` - Thêm Supabase credentials

  **Frontend:**
  - `frontend/src/components/proctoring/WebcamRecorder.tsx` - Student webcam recording
  - `frontend/src/components/proctoring/ScreenRecorder.tsx` - Student screen recording
  - `frontend/src/components/proctoring/SeamlessVideoPlayer.tsx` - Video player (hỗ trợ webcam/screen)
  - `frontend/src/components/proctoring/ProctoringViewer.tsx` - Teacher view (webcam + screen)
  - `frontend/src/components/ui/slider.tsx` - Slider component cho video player
  - `frontend/src/lib/api.ts` - Thêm proctoring API functions (webcam + screen)
  - `frontend/src/app/(dashboard)/student/exam/page.tsx` - Tích hợp WebcamRecorder + ScreenRecorder
  - `frontend/src/app/(dashboard)/teacher/results/[id]/page.tsx` - Tích hợp ProctoringViewer

  **Documentation:**
  - `docs/PROCTORING_SETUP.md` - Hướng dẫn setup Supabase (cập nhật cho screen recording)

  ---

  1. Context & Tech Stack
   * Project: EIU_TestLab.
   * Backend: NestJS, Prisma ORM.
   * Frontend: Next.js (App Router), Tailwind CSS.
   * Database: PostgreSQL.
   * Storage: Supabase Storage (Bucket: proctoring-videos).

  2. Kiến trúc Kỹ thuật (Technical Architecture)

  A. Luồng Ghi hình (Student Side) - Cơ chế "Chunking"
  Thay vì quay 1 file lớn, Client sẽ thực hiện:
   1. Recording: Sử dụng MediaRecorder API.
   2. Slicing: Cứ mỗi 10 giây (hoặc 30 giây), cắt stream thành một file Blob (Chunk).
   3. Uploading: Gửi ngay lập tức chunk đó lên Backend.
   4. Naming: File được đặt tên theo số thứ tự tăng dần (VD: 1.webm, 2.webm...) để dễ dàng sắp xếp lại sau này.

  B. Luồng Xem lại (Teacher Side) - Cơ chế "Seamless Playlist"
  Để giáo viên xem được liền mạch mà không cần Server phải tốn CPU ghép file:
   1. Fetching: Client lấy danh sách toàn bộ các file video nhỏ của sinh viên đó.
   2. Sorting: Sắp xếp file theo tên (1.webm, 2.webm, 3.webm...).
   3. Sequential Playback: Player sẽ tự động phát file 1, đồng thời preload (tải trước) file 2. Ngay khi file 1 kết
      thúc, file 2 sẽ phát ngay lập tức.
   4. UX: Ẩn các khoảng giật giữa các file để tạo cảm giác như một video dài duy nhất.

  ---

  3. Yêu cầu chi tiết (Detailed Requirements)

  Phase 1: Database & Configuration
   * Schema: Cập nhật model Attempt trong schema.prisma:
       * Thêm trường proctoringVideoPath (String, nullable) để lưu đường dẫn folder chứa video trên Supabase (VD:
         exam_123/student_456/).
   * Env: Thêm SUPABASE_URL và SUPABASE_KEY vào .env.

  Phase 2: Backend (NestJS)
   * Service (`ProctoringService`):
       * uploadChunk(examId, attemptId, sequence, file): Upload file lên Supabase theo đường dẫn:
         {examId}/{attemptId}/{sequence}.webm.
       * getAttemptVideos(attemptId): Liệt kê danh sách tất cả các file trong folder của attempt đó từ Supabase, trả về
         mảng URLs đã sắp xếp.
   * Controller:
       * POST /attempts/:id/proctoring/chunk: Nhận file blob từ sinh viên.
       * GET /attempts/:id/proctoring/playlist: API trả về danh sách video cho giáo viên xem.

  Phase 3: Frontend - Student (Next.js)
   * Component `WebcamRecorder`:
* Hiển thị khung hình camera nhỏ ở góc màn hình.
       * Tự động bắt đầu quay khi vào thi.
       * Xử lý lỗi: Nếu upload 1 chunk thất bại, hệ thống phải thử lại (retry) ít nhất 3 lần trước khi bỏ qua, không
         được làm gián đoạn bài thi.

  Phase 4: Frontend - Teacher (Next.js)
   * Component `SeamlessVideoPlayer`:
       * Input: attemptId.
       * Logic: Gọi API getAttemptVideos để lấy danh sách chunks.
       * UI: Sử dụng thẻ <video> HTML5. Lắng nghe sự kiện onEnded của video hiện tại để chuyển ngay source (src) sang
         video tiếp theo và play().
       * Tối ưu: Preload chunk tiếp theo để giảm độ trễ (buffer) xuống bằng 0.

  Phase 5: Supabase Setup
   * Cung cấp hướng dẫn tạo Bucket proctoring-videos.
   * Thiết lập Policy (RLS) để cho phép upload và read.

  ---

  4. Kế hoạch thực thi (Step-by-Step Plan)

   1. Setup: Cài đặt thư viện @supabase/supabase-js, cấu hình biến môi trường, update Prisma schema.
   2. Backend Implementation: Viết API upload chunk và API lấy danh sách playlist.
   3. Frontend (Student): Implement WebcamRecorder với logic cắt file và upload ngầm.
   4. Frontend (Teacher): Implement SeamlessVideoPlayer để xem lại video liền mạch.