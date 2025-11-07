# Hướng Dẫn Khắc Phục Lỗi - Online Exam System

## Lỗi "Internal Server Error" khi làm bài thi

### Nguyên nhân chính:

1. **Chưa đăng nhập hoặc token hết hạn**
2. **Backend không chạy**
3. **Frontend gọi sai port API**
4. **CORS không được cấu hình đúng**

### Cách khắc phục:

#### 1. Kiểm tra Backend đang chạy

```powershell
# Kiểm tra backend đang chạy trên port 3001
netstat -ano | Select-String ":3001" | Select-String "LISTENING"
```

Nếu không thấy kết quả, khởi động backend:

```powershell
cd backend
npm run start:dev
```

#### 2. Kiểm tra Frontend đang chạy

```powershell
# Kiểm tra frontend đang chạy trên port 3000
netstat -ano | Select-String ":3000" | Select-String "LISTENING"
```

Nếu không thấy kết quả, khởi động frontend:

```powershell
cd frontend
npm run dev
```

#### 3. Đảm bảo đã đăng nhập

- Mở DevTools (F12) → Application → Local Storage
- Kiểm tra có key `token` không
- Nếu không có hoặc token hết hạn, đăng nhập lại

#### 4. Kiểm tra cấu hình API

File `frontend/.env.local` phải có:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 5. Xem logs chi tiết

**Frontend (Chrome DevTools):**
- F12 → Console
- Xem các lỗi API call

**Backend:**
- Xem terminal đang chạy `npm run start:dev`
- Tìm các lỗi authentication hoặc validation

### Các lỗi thường gặp:

#### A. "Unauthorized" (401)
- **Nguyên nhân**: Chưa đăng nhập hoặc token hết hạn
- **Giải pháp**: Đăng xuất và đăng nhập lại

#### B. "This exam has no questions"
- **Nguyên nhân**: Bài thi chưa có câu hỏi
- **Giải pháp**: 
  - Giáo viên cần thêm câu hỏi vào bài thi
  - Hoặc chọn bài thi khác

#### C. "You have already completed this exam"
- **Nguyên nhân**: Đã làm bài thi này rồi
- **Giải pháp**: 
  - Xem kết quả tại trang "My Results"
  - Liên hệ giáo viên để làm lại (nếu được phép)

#### D. "Exam has not started yet" hoặc "Exam has ended"
- **Nguyên nhân**: Bài thi có thời gian mở/đóng
- **Giải pháp**: Đợi đến thời gian mở hoặc chọn bài thi khác

### Debug Steps:

1. **Mở Chrome DevTools (F12)**
2. **Vào tab Console**
3. **Reload trang và xem logs:**
   - "Loading exam with ID: ..."
   - "Token: Present" hoặc "Token: Missing"
   - "Loaded exam: ..."
   - "Starting attempt for exam: ..."

4. **Nếu thấy lỗi 401 (Unauthorized):**
   ```
   Error details: { status: 401, ... }
   ```
   → Đăng nhập lại

5. **Nếu thấy lỗi 400 (Bad Request):**
   ```
   Error details: { status: 400, message: "..." }
   ```
   → Đọc message để biết nguyên nhân cụ thể

6. **Nếu thấy lỗi 500 (Internal Server Error):**
   → Xem logs của backend để biết chi tiết

### Testing Database:

Kiểm tra xem bài thi có câu hỏi không:

```sql
-- Kiểm tra bài thi
SELECT id, title, "createdBy"
FROM "Exam"
LIMIT 5;

-- Kiểm tra câu hỏi của bài thi
SELECT e.title, COUNT(q.id) as question_count
FROM "Exam" e
LEFT JOIN "Question" q ON q."examId" = e.id
GROUP BY e.id, e.title;
```

### Quick Fixes:

#### Reset và restart tất cả:

```powershell
# Stop tất cả processes
# Ctrl+C trong các terminal đang chạy

# Backend
cd backend
npm run start:dev

# Frontend (terminal mới)
cd frontend
npm run dev
```

#### Clear cache và login lại:

1. F12 → Application → Local Storage → Clear All
2. Reload trang
3. Đăng nhập lại

### Liên hệ Support:

Nếu vẫn gặp lỗi, cung cấp thông tin sau:
- Screenshot lỗi trên UI
- Logs từ Console (F12)
- Logs từ backend terminal
- Thời điểm xảy ra lỗi
- Tài khoản đang sử dụng
