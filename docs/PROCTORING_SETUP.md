# Proctoring System - Supabase Setup Guide

Hướng dẫn thiết lập Supabase Storage cho hệ thống giám sát thi (Proctoring).

## 📋 Tổng quan

Hệ thống Proctoring sử dụng Supabase Storage để lưu trữ:
- **Video webcam** - Quay hình sinh viên trong quá trình thi
- **Video màn hình** - Ghi lại màn hình máy tính của sinh viên

Video được chia nhỏ thành các chunk 10 giây và upload liên tục để đảm bảo an toàn dữ liệu.

## 🚀 Bước 1: Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng nhập hoặc tạo tài khoản mới
3. Click **"New Project"**
4. Điền thông tin:
   - **Name**: `eiu-testlab` (hoặc tên bạn muốn)
   - **Database Password**: Tạo password mạnh
   - **Region**: Chọn region gần nhất (ví dụ: Southeast Asia - Singapore)
5. Click **"Create new project"**

## 🪣 Bước 2: Tạo Storage Bucket

1. Trong Supabase Dashboard, vào **Storage** (thanh menu bên trái)
2. Click **"New bucket"**
3. Điền thông tin:
   - **Name**: `proctoring-videos`
   - **Public bucket**: **❌ Để OFF** (private bucket)
   - **Allowed MIME types**: `video/webm, video/mp4`
   - **File size limit**: `50MB` (50000000 bytes)
4. Click **"Create bucket"**

## 🔐 Bước 3: Thiết lập Storage Policies (RLS)

Vào **Storage** → **Policies** → Chọn bucket `proctoring-videos` → **New Policy**

### Policy 1: Allow authenticated uploads

```sql
-- Policy name: Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proctoring-videos'
);
```

**Hoặc dùng UI:**
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**: `bucket_id = 'proctoring-videos'`

### Policy 2: Allow read for teachers and admins

Vì Service Role Key bypass RLS, nên chúng ta sẽ dùng Service Role Key ở Backend.

```sql
-- Policy name: Allow read for service role
CREATE POLICY "Allow service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'proctoring-videos')
WITH CHECK (bucket_id = 'proctoring-videos');
```

## 🔑 Bước 4: Lấy API Keys

1. Vào **Settings** → **API**
2. Copy các giá trị sau:

| Key | Mô tả | Sử dụng |
|-----|-------|---------|
| **Project URL** | URL của project | `SUPABASE_URL` |
| **service_role key** (secret) | Key có full quyền, bypass RLS | `SUPABASE_KEY` |

⚠️ **QUAN TRỌNG**: Không bao giờ expose `service_role key` ra client-side!

## ⚙️ Bước 5: Cấu hình Backend

### Cập nhật `.env`:

```env
# Supabase Storage (for Proctoring Videos)
SUPABASE_URL=https://hcgytexcnrrwqyfspmrm.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZ3l0ZXhjbnJyd3F5ZnNwbXJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU2MjIxNCwiZXhwIjoyMDc3MTM4MjE0fQ.QSj2OV4OyOIY0mYk3Zr-PK1PKnFJ2WozEXudiFJPL8M
### Cài đặt dependencies:

```bash
cd backend
npm install @supabase/supabase-js
```

### Chạy Prisma migration:

```bash
npx prisma migrate dev --name add-proctoring-video-path
```

## 🧪 Bước 6: Test Hệ thống

### 1. Kiểm tra kết nối Supabase

```bash
# Trong backend folder
npm run start:dev
```

Truy cập `GET /attempts/proctoring/status` để kiểm tra:
```json
{
  "enabled": true
}
```

### 2. Test Upload Chunk (với Postman/curl)

```bash
curl -X POST http://localhost:4000/attempts/{attemptId}/proctoring/chunk/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@test-video.webm"
```

### 3. Test Get Playlist

```bash
curl http://localhost:4000/attempts/{attemptId}/proctoring/playlist \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📁 Cấu trúc Lưu trữ

```
proctoring-videos/
├── exam_abc123/
│   ├── attempt_xyz789/
│   │   ├── webcam/
│   │   │   ├── 1.webm
│   │   │   ├── 2.webm
│   │   │   └── ...
│   │   └── screen/
│   │       ├── 1.webm
│   │       ├── 2.webm
│   │       └── ...
│   └── attempt_def456/
│       ├── webcam/
│       │   └── ...
│       └── screen/
│           └── ...
└── exam_ghi012/
    └── ...
```

## 🎥 Sử dụng Components

### WebcamRecorder (Student Side)

```tsx
import { WebcamRecorder } from '@/components/proctoring';

// Trong trang làm bài thi
<WebcamRecorder
  attemptId={attemptId}
  isRecording={examInProgress}
  chunkInterval={10} // 10 giây mỗi chunk
  maxRetries={3}
  onError={(error) => console.error('Proctoring error:', error)}
/>
```

### ScreenRecorder (Student Side)

```tsx
import { ScreenRecorder } from '@/components/proctoring';

// Trong trang làm bài thi
<ScreenRecorder
  attemptId={attemptId}
  isRecording={examInProgress}
  chunkInterval={10} // 10 giây mỗi chunk
  maxRetries={3}
  onError={(error) => console.error('Screen recording error:', error)}
  onStatusChange={(status) => console.log('Screen status:', status)}
/>
```

### ProctoringViewer (Teacher Side)

Component tổng hợp để xem cả video webcam và màn hình:

```tsx
import { ProctoringViewer } from '@/components/proctoring';

// Trong trang xem kết quả bài thi
<ProctoringViewer
  attemptId={attemptId}
/>
```

Hỗ trợ 2 chế độ xem:
- **Tab**: Chuyển đổi giữa webcam và màn hình
- **Song song (Side-by-side)**: Xem cả 2 video cùng lúc

### SeamlessVideoPlayer (Teacher Side)

```tsx
import { SeamlessVideoPlayer } from '@/components/proctoring';

// Xem video webcam
<SeamlessVideoPlayer
  attemptId={attemptId}
  type="webcam"
  className="w-full max-w-3xl"
  onError={(error) => console.error('Playback error:', error)}
/>

// Xem video màn hình
<SeamlessVideoPlayer
  attemptId={attemptId}
  type="screen"
  className="w-full max-w-3xl"
  onError={(error) => console.error('Playback error:', error)}
/>
```

## 🔧 Troubleshooting

### 1. Upload thất bại: "Supabase not configured"

- Kiểm tra `SUPABASE_URL` và `SUPABASE_KEY` trong `.env`
- Đảm bảo đã restart server sau khi thêm env

### 2. Upload thất bại: "Storage object not found"

- Kiểm tra bucket `proctoring-videos` đã được tạo
- Kiểm tra RLS policies đã được thiết lập

### 3. Không xem được video (CORS error)

- Thêm domain frontend vào Supabase CORS settings:
  - **Settings** → **API** → **CORS** → Thêm `http://localhost:3000`

### 4. Signed URL hết hạn

- Mặc định URL có thời hạn 1 giờ
- Nếu cần xem lâu hơn, điều chỉnh trong `proctoring.service.ts`

## 📊 Quota & Pricing

### Free Tier (Supabase Free Plan)
- **Storage**: 1GB
- **Bandwidth**: 2GB/month
- **File uploads**: Unlimited

### Ước tính dung lượng
- 1 chunk (10 giây) ≈ 500KB - 2MB
- 1 bài thi 60 phút ≈ 36 chunks ≈ 18-72MB
- 100 bài thi/tháng ≈ 1.8-7.2GB

➡️ Với usage cao, cân nhắc nâng lên Pro Plan ($25/month) với 100GB storage.

## 🔒 Security Best Practices

1. **Không expose Service Role Key**: Chỉ dùng ở server-side
2. **Validate attempt ownership**: Backend kiểm tra user có quyền upload/xem video không
3. **Set expiring signed URLs**: Giới hạn thời gian truy cập video
4. **Cleanup old videos**: Có thể setup cron job xóa video cũ sau X tháng

---

## 📚 Tài liệu tham khảo

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
