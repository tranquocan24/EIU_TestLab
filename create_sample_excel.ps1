# Script tạo file Excel mẫu để test import users

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Add()
$worksheet = $workbook.Worksheets.Item(1)
$worksheet.Name = "Users"

# Header
$headers = @("username", "password", "name", "email", "role", "courses")
for ($i = 0; $i -lt $headers.Length; $i++) {
    $cell = $worksheet.Cells.Item(1, $i + 1)
    $cell.Value2 = $headers[$i]
    $cell.Font.Bold = $true
    $cell.Interior.Color = 4490683  # Blue
    $cell.Font.Color = 16777215     # White
    $cell.HorizontalAlignment = -4108  # Center
}

# Data
$data = @(
    @("student001", "123456", "Nguyễn Văn A", "student001@student.eiu.edu.vn", "STUDENT", "CSE301"),
    @("student002", "123456", "Trần Thị B", "student002@student.eiu.edu.vn", "STUDENT", "CSE301,CSE302"),
    @("student003", "123456", "Lê Văn C", "student003@student.eiu.edu.vn", "STUDENT", "CSE302"),
    @("student004", "123456", "Phạm Văn D", "student004@student.eiu.edu.vn", "STUDENT", "CSE301"),
    @("student005", "123456", "Hoàng Thị E", "student005@student.eiu.edu.vn", "STUDENT", "CSE302"),
    @("teacher001", "123456", "Võ Văn F", "teacher001@eiu.edu.vn", "TEACHER", "CSE301,CSE302"),
    @("teacher002", "123456", "Đặng Thị G", "teacher002@eiu.edu.vn", "TEACHER", "CSE301"),
    @("admin001", "admin123", "Bùi Văn H", "admin001@eiu.edu.vn", "ADMIN", "")
)

# Thêm dữ liệu vào worksheet
for ($row = 0; $row -lt $data.Length; $row++) {
    for ($col = 0; $col -lt $data[$row].Length; $col++) {
        $worksheet.Cells.Item($row + 2, $col + 1).Value2 = $data[$row][$col]
    }
}

# Tự động điều chỉnh độ rộng cột
$worksheet.Columns.Item(1).ColumnWidth = 15  # username
$worksheet.Columns.Item(2).ColumnWidth = 12  # password
$worksheet.Columns.Item(3).ColumnWidth = 20  # name
$worksheet.Columns.Item(4).ColumnWidth = 35  # email
$worksheet.Columns.Item(5).ColumnWidth = 10  # role
$worksheet.Columns.Item(6).ColumnWidth = 20  # courses

# Lưu file
$outputPath = "c:\Users\qanpr\Downloads\Online_Exam_System\sample_import_users.xlsx"
$workbook.SaveAs($outputPath)
$workbook.Close()
$excel.Quit()

# Giải phóng COM objects
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($worksheet) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "✅ File Excel đã được tạo thành công!" -ForegroundColor Green
Write-Host "📁 Đường dẫn: $outputPath" -ForegroundColor Cyan
Write-Host "📊 Số lượng users mẫu: $($data.Length)" -ForegroundColor Yellow
Write-Host "   - Students: $($data | Where-Object { $_[4] -eq 'STUDENT' } | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Yellow
Write-Host "   - Teachers: $($data | Where-Object { $_[4] -eq 'TEACHER' } | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Yellow
Write-Host "   - Admins: $($data | Where-Object { $_[4] -eq 'ADMIN' } | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Yellow
