# Debug Guide - Student Exam Page

## Các bước kiểm tra khi gặp lỗi "Internal Server Error"

### Bước 1: Kiểm tra đăng nhập

1. Mở Chrome DevTools (F12)
2. Chọn tab **Application**
3. Trong sidebar bên trái, chọn **Local Storage** → `http://localhost:3000`
4. Kiểm tra có key `token` không

**Nếu KHÔNG có token:**
- Đăng xuất và đăng nhập lại
- Hoặc vào trang `/login`

**Nếu CÓ token:**
- Kiểm tra giá trị token có phải là chuỗi dài (JWT) không
- Nếu token ngắn hoặc lỗi format → Đăng nhập lại

### Bước 2: Kiểm tra Console Logs

1. Mở Chrome DevTools (F12)
2. Chọn tab **Console**
3. Reload trang và làm bài thi
4. Tìm các dòng log sau:

```
Loading exam with ID: xyz...
Token: Present (hoặc Missing)
Loaded exam: {...}
Starting attempt for exam: xyz...
```

### Bước 3: Phân tích lỗi

#### Case 1: Token Missing
```
Token: Missing
Error: 401 Unauthorized
```
**Giải pháp:** Đăng nhập lại

#### Case 2: Exam has no questions
```
Error: This exam has no questions
```
**Giải pháp:**
- Chọn bài thi khác
- Hoặc liên hệ giáo viên để thêm câu hỏi

#### Case 3: Already completed
```
Error: You have already completed this exam
```
**Giải pháp:**
- Xem kết quả tại `/student/results`
- Liên hệ giáo viên để làm lại (nếu cần)

#### Case 4: Network Error
```
Error: Network Error
```
**Giải pháp:**
- Kiểm tra backend có đang chạy không:
  ```powershell
  netstat -ano | Select-String ":3001"
  ```
- Khởi động backend nếu cần:
  ```powershell
  cd backend
  npm run start:dev
  ```

### Bước 4: Xem Network Tab

1. DevTools (F12) → **Network** tab
2. Reload trang
3. Tìm request đến `/exams/{id}` và `/attempts/start`
4. Click vào request để xem:
   - **Headers**: Có Authorization Bearer token không?
   - **Response**: Nội dung lỗi chi tiết

### Bước 5: Kiểm tra Backend Logs

Nếu vẫn lỗi, xem logs trong terminal đang chạy backend:

```
[Nest] 12345 - 11/06/2025, 10:30:00 AM   ERROR [ExceptionsHandler] ...
```

## Quick Checklist

✅ Backend đang chạy trên port 3001  
✅ Frontend đang chạy trên port 3000  
✅ Đã đăng nhập (có token trong LocalStorage)  
✅ Bài thi có câu hỏi  
✅ Chưa làm bài thi này  
✅ Thời gian làm bài hợp lệ  

## Testing với Postman/Thunder Client

Nếu muốn test API trực tiếp:

### 1. Login để lấy token
```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "username": "student1",
  "password": "password123"
}
```

Response:
```json
{
  "user": {...},
  "access_token": "eyJhbGc..."
}
```

### 2. Get Exam
```http
GET http://localhost:3001/exams/{examId}
Authorization: Bearer eyJhbGc...
```

### 3. Start Attempt
```http
POST http://localhost:3001/attempts/start
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "examId": "your-exam-id"
}
```

## Common Solutions

### Reset Everything
```powershell
# Stop all terminals (Ctrl+C)

# Clear browser data
# F12 → Application → Clear storage

# Restart backend
cd backend
npm run start:dev

# Restart frontend (new terminal)
cd frontend  
npm run dev

# Login again at http://localhost:3000/login
```

### Check Database
```sql
-- Kiểm tra exams
SELECT id, title, "createdBy" FROM "Exam";

-- Kiểm tra questions
SELECT e.title, COUNT(q.id) as questions
FROM "Exam" e
LEFT JOIN "Question" q ON q."examId" = e.id
GROUP BY e.id, e.title;

-- Kiểm tra attempts
SELECT * FROM "Attempt" WHERE "studentId" = 'your-user-id';
```
