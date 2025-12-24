# Single Session Testing Guide

## Tính năng đã implement
Hệ thống giờ đây chỉ cho phép **MỘT session đăng nhập** cho mỗi tài khoản (giống Zalo Web).

## Cách hoạt động

### Backend
1. **Database Session Tracking**: Mỗi user có `sessionId` và `lastLoginAt` trong database
2. **JWT với SessionID**: Khi login, server tạo UUID mới cho session và lưu vào DB + JWT payload
3. **Middleware Validation**: Mỗi API request validate sessionId trong JWT khớp với DB
4. **WebSocket Notification**: Khi login mới, server emit `session-kicked` đến session cũ

### Frontend
1. **Socket Listener**: NotificationListener component lắng nghe event `session-kicked`
2. **Auto Logout**: Khi nhận event, clear localStorage và redirect về login page
3. **Toast Notification**: Hiển thị thông báo "Bạn đã đăng nhập ở thiết bị khác"

## Hướng dẫn Test

### Bước 1: Khởi động hệ thống

#### Backend
```powershell
cd backend
npm run start:dev
```

#### Frontend  
```powershell
cd frontend
npm run dev
```

### Bước 2: Test Single Session

#### Test Case 1: Kick session qua WebSocket (Real-time)
1. **Device 1 (Browser 1)**: 
   - Mở `http://localhost:3000/login`
   - Login với tài khoản test (ví dụ: `student1` / password)
   - Vào dashboard, để tab mở

2. **Device 2 (Browser 2 hoặc Incognito)**: 
   - Mở `http://localhost:3000/login`
   - Login **cùng tài khoản** `student1`
   - Vào dashboard

3. **Kết quả mong đợi**:
   - ✅ Device 1: Nhận toast notification "Bạn đã đăng nhập ở thiết bị khác"
   - ✅ Device 1: Tự động redirect về `/login` sau 1.5 giây
   - ✅ Device 2: Login thành công, sử dụng bình thường

#### Test Case 2: Kick session qua API (Khi socket disconnect)
1. **Device 1**: Login và vào dashboard
2. **Device 1**: Tắt tab hoặc mất kết nối internet (socket disconnect)
3. **Device 2**: Login cùng tài khoản
4. **Device 1**: Bật lại, thử gọi API (ví dụ: refresh page, load exams)

5. **Kết quả mong đợi**:
   - ✅ Device 1: API calls bị reject với 401 Unauthorized
   - ✅ Device 1: JWT validation fail vì sessionId không khớp
   - ✅ Frontend redirect về login page do 401 error

#### Test Case 3: Multiple logins liên tiếp
1. Login ở Browser 1
2. Login ở Browser 2 (kick Browser 1)
3. Login ở Browser 3 (kick Browser 2)
4. Quay lại Browser 1, login lại (kick Browser 3)

**Kết quả**: Chỉ có browser login cuối cùng được sử dụng

### Bước 3: Verify trong Database

```sql
-- Xem sessionId và lastLoginAt của users
SELECT id, username, "sessionId", "lastLoginAt", "updatedAt"
FROM users
ORDER BY "lastLoginAt" DESC;
```

Sau mỗi lần login:
- ✅ `sessionId` thay đổi thành UUID mới
- ✅ `lastLoginAt` cập nhật timestamp hiện tại

### Bước 4: Kiểm tra Console Logs

#### Backend logs (Terminal backend)
```
✅ User abc123 connected (socket-id-xyz)
🔄 User abc123 logging in from new device. Kicking old session socket-id-old
❌ User abc123 disconnected (socket-id-old)
```

#### Frontend logs (Browser Console Device 1)
```
❌ Disconnected from notification server: io server disconnect
📡 Received session-kicked event
```

## Các tính năng bổ sung (Optional - có thể thêm sau)

### 1. Device/Browser Tracking
Thêm vào User model:
```prisma
lastLoginDevice  String?   // "Chrome on Windows"
lastLoginIp      String?   // IP address
```

### 2. Session Management Dashboard
Trang cho user xem:
- Các thiết bị đã login
- Thời gian login gần nhất
- Nút "Logout all devices"

### 3. Grace Period
Delay 30 giây trước khi kick session cũ, cho phép user cancel

### 4. Multiple Sessions cho ADMIN
Cho phép admin có nhiều sessions đồng thời:
```typescript
if (user.role !== 'ADMIN' && existingSocketId) {
  // Kick old session
}
```

## Troubleshooting

### Issue 1: Session cũ không bị kick
**Nguyên nhân**: Socket không connect
**Giải pháp**: 
- Check backend logs xem socket có connect không
- Verify CORS settings trong NotificationsGateway
- Kiểm tra `NEXT_PUBLIC_SOCKET_URL` trong frontend `.env`

### Issue 2: Cả 2 sessions đều hoạt động
**Nguyên nhân**: SessionId validation không chạy
**Giải pháp**:
- Verify JwtStrategy có check sessionId
- Check migration đã chạy: `npx prisma migrate status`
- Xem database có column `sessionId` chưa

### Issue 3: Liên tục bị logout
**Nguyên nhân**: Token expired hoặc sessionId null
**Giải pháp**:
- Check JWT expiration time
- Verify login API response có trả về token mới
- Clear localStorage và login lại

## Technical Details

### JWT Payload Structure
```json
{
  "sub": "user-uuid",
  "username": "student1",
  "role": "STUDENT",
  "sessionId": "generated-uuid-v4",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Socket Event: session-kicked
```typescript
{
  message: "Bạn đã đăng nhập ở thiết bị khác",
  timestamp: "2025-12-24T09:30:00.000Z"
}
```

### Database Schema
```sql
ALTER TABLE "users" 
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);
```

## Security Considerations

✅ **Session hijacking prevention**: SessionId stored in DB, không chỉ dựa vào JWT
✅ **Token reuse prevention**: Old tokens bị invalidate khi sessionId thay đổi
✅ **Real-time kick**: WebSocket đảm bảo kick ngay lập tức
✅ **Fallback protection**: API validation catch trường hợp socket fail

## Performance Impact

- ✅ Minimal: Chỉ 1 DB query thêm khi validate JWT (có thể cache)
- ✅ No Redis required: Sử dụng PostgreSQL đã có
- ✅ Efficient socket: Chỉ emit đến 1 socket cụ thể, không broadcast

## Conclusion

Implementation này cung cấp:
- ✅ Security: Database-backed session validation
- ✅ UX: Real-time notification khi bị kick
- ✅ Reliability: Fallback qua API validation nếu socket fail
- ✅ Simplicity: Không cần thêm infrastructure (Redis, etc)
