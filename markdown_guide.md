# Hướng dẫn tạo đề thi bằng Markdown

## Giới thiệu
Chức năng này cho phép bạn import đề thi từ file Markdown (.md) với định dạng đặc biệt. Điều này giúp bạn tạo đề thi nhanh chóng và có thể chia sẻ đề thi dưới dạng văn bản.

**Hỗ trợ 2 loại câu hỏi:**
1. **Trắc nghiệm 1 đáp án** (multiple-choice)
2. **Tự luận** (text)

## Cấu trúc file Markdown

### 1. Thông tin đề thi (Header)
```markdown
# Tên đề thi

**Môn học:** Tên môn học  
**Thời gian:** 90 phút  
**Số câu hỏi:** 10  
**Mô tả:** Mô tả về đề thi

---
```

### 2. Câu hỏi trắc nghiệm 1 đáp án
```markdown
## Câu 1: Nội dung câu hỏi
**Loại:** multiple-choice  
**Điểm:** 1

Nội dung câu hỏi ở đây
- A. Đáp án A
- B. Đáp án B
- C. Đáp án C
- D. Đáp án D

**Đáp án:** A

---
```

### 3. Câu hỏi tự luận
```markdown
## Câu 2: Nội dung câu hỏi
**Loại:** text  
**Điểm:** 3

Nội dung câu hỏi tự luận ở đây

**Đáp án mẫu:** 
Đáp án mẫu hoặc hướng dẫn chấm điểm

---
```

## Quy tắc quan trọng

1. **Tiêu đề câu hỏi**: Phải bắt đầu bằng `## Câu X:`
2. **Loại câu hỏi**: Chỉ có 2 loại được hỗ trợ
   - `multiple-choice`: Trắc nghiệm 1 đáp án đúng
   - `text`: Câu hỏi tự luận
3. **Điểm số**: Phải là số nguyên dương
4. **Đáp án**: 
   - Trắc nghiệm: Chỉ một chữ cái (A, B, C, D...)
   - Tự luận: Đáp án mẫu hoặc hướng dẫn chấm
5. **Phân cách**: Sử dụng `---` để phân cách giữa các câu hỏi
6. **Số lượng đáp án**: Có thể có 2-6 đáp án cho câu trắc nghiệm

## Lưu ý khi sử dụng

- File phải có phần mở rộng `.md`
- Sử dụng encoding UTF-8 để hỗ trợ tiếng Việt
- Kiểm tra xem trước trước khi import
- Sau khi import, bạn có thể chỉnh sửa thêm trong giao diện tạo đề thi

## Các trường hợp đặc biệt (Edge Cases)

### 1. Câu hỏi có code block
```markdown
## Câu 10: Nội dung câu hỏi với code
**Loại:** multiple-choice  
**Điểm:** 2

Kết quả của đoạn code sau là gì?
```javascript
console.log(typeof null);
```

- A. "null"
- B. "object"
- C. "undefined"
- D. "number"

**Đáp án:** B

---
```

### 2. Câu hỏi có ký tự đặc biệt
```markdown
## Câu 5: Toán học
**Loại:** multiple-choice  
**Điểm:** 1

Tính: 5 + 3 × 2 = ?
- A. 16
- B. 11
- C. 13
- D. 10

**Đáp án:** B

---
```

### 3. Câu hỏi có dấu gạch đầu dòng trong nội dung
Nếu nội dung câu hỏi có dấu gạch đầu dòng, thêm khoảng trắng hoặc số thứ tự:

```markdown
## Câu 8: HTML Tags
**Loại:** text  
**Điểm:** 3

Liệt kê 3 thẻ HTML semantic:
1. header
2. nav
3. footer

**Đáp án mẫu:**
Các thẻ semantic HTML bao gồm: header, nav, main, article, section, aside, footer

---
```

## Lỗi thường gặp và cách khắc phục

| Lỗi | Nguyên nhân | Giải pháp |
|------|-------------|-----------|
| "Invalid markdown format" | Thiếu thông tin header hoặc sai cú pháp | Kiểm tra lại header có đầy đủ: Môn học, Thời gian |
| "Question type not recognized" | Loại câu hỏi không đúng | **Chỉ dùng: `multiple-choice` hoặc `text`** |
| "Invalid answer format" | Đáp án không đúng format | Trắc nghiệm: 1 chữ cái (A, B, C, D...) |
| "Missing separator" | Thiếu `---` giữa các câu | Thêm `---` để phân cách các câu hỏi |
| "Encoding error" | File không phải UTF-8 | Lưu file với encoding UTF-8 |
| "Đáp án không hiển thị" | Lỗi format đáp án | Đảm bảo format: `- A. Nội dung đáp án` |

## Mẹo tạo đề thi hiệu quả

1. **Sử dụng template**: Copy từ `sample_exam.md` và chỉnh sửa
2. **Preview trước khi import**: Luôn xem trước để phát hiện lỗi
3. **Backup**: Giữ bản markdown để sử dụng lại hoặc chia sẻ
4. **Tổ chức câu hỏi**: Sắp xếp từ dễ đến khó
5. **Điểm số hợp lý**: Câu dễ (1-2 điểm), trung bình (2-3 điểm), khó (3-5 điểm)

## Ví dụ file hoàn chỉnh

Xem file `sample_exam.md` để tham khảo một ví dụ hoàn chỉnh về cách tạo đề thi bằng Markdown.

## Hỗ trợ

Nếu gặp vấn đề khi import đề thi:
1. Kiểm tra file có đúng định dạng theo hướng dẫn
2. Đảm bảo file được lưu với encoding UTF-8
3. Sử dụng tính năng Preview để xác định lỗi cụ thể
4. So sánh với file `sample_exam.md` mẫu
