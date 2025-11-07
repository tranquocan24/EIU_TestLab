'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react'
import api from '@/lib/api'
import * as XLSX from 'xlsx'

export default function ImportUsersPage() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
        }
    }

    const parseExcelToJSON = async (file: File) => {
        return new Promise<any[]>((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const data = e.target?.result

                    // Check file type
                    if (file.name.endsWith('.csv')) {
                        // Parse CSV
                        const text = data as string
                        const lines = text.split(/\r?\n/).filter(line => line.trim())

                        if (lines.length < 2) {
                            throw new Error('File phải có ít nhất 1 dòng header và 1 dòng dữ liệu')
                        }

                        const header = lines[0].split(',').map(h => h.trim().toLowerCase())
                        console.log('CSV Header:', header)

                        const users = parseDataRows(header, lines.slice(1).map(line => {
                            return line.split(',').map(v => v.trim())
                        }))

                        resolve(users)
                    } else {
                        // Parse Excel (.xlsx, .xls)
                        const binaryData = new Uint8Array(data as ArrayBuffer)
                        const workbook = XLSX.read(binaryData, { type: 'array' })

                        const firstSheetName = workbook.SheetNames[0]
                        const worksheet = workbook.Sheets[firstSheetName]

                        // Convert to JSON array
                        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
                        console.log('Excel raw data:', jsonData)

                        if (jsonData.length < 2) {
                            throw new Error('File phải có ít nhất 1 dòng header và 1 dòng dữ liệu')
                        }

                        const header = jsonData[0].map((h: any) => String(h).trim().toLowerCase())
                        console.log('Excel Header:', header)

                        const dataRows = jsonData.slice(1).map((row: any[]) => {
                            return row.map(cell => cell ? String(cell).trim() : '')
                        })

                        const users = parseDataRows(header, dataRows)
                        resolve(users)
                    }
                } catch (error) {
                    console.error('Parse error:', error)
                    reject(error)
                }
            }

            reader.onerror = () => reject(new Error('Failed to read file'))

            // Read file based on type
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file)
            } else {
                reader.readAsArrayBuffer(file)
            }
        })
    }

    const parseDataRows = (header: string[], dataRows: string[][]) => {
        const requiredCols = ['username', 'password', 'name', 'role']
        const missingCols = requiredCols.filter(col => !header.includes(col))

        if (missingCols.length > 0) {
            throw new Error(`Thiếu các cột bắt buộc: ${missingCols.join(', ')}`)
        }

        return dataRows.map((rowValues, index) => {
            const row: Record<string, string> = {}

            header.forEach((col, i) => {
                row[col] = rowValues[i] || ''
            })

            console.log(`Row ${index + 2}:`, row)

            if (!row.username || !row.password || !row.name || !row.role) {
                throw new Error(`Dòng ${index + 2}: Thiếu thông tin bắt buộc`)
            }

            const validRoles = ['STUDENT', 'TEACHER', 'ADMIN']
            const roleUpper = row.role.toUpperCase()
            if (!validRoles.includes(roleUpper)) {
                throw new Error(`Dòng ${index + 2}: Role không hợp lệ "${row.role}"`)
            }

            return {
                username: row.username,
                password: row.password,
                name: row.name,
                email: row.email || undefined,
                role: roleUpper as 'STUDENT' | 'TEACHER' | 'ADMIN',
                courses: row.courses || undefined
            }
        })
    }

    const handleImport = async () => {
        if (!file) {
            alert('Vui lòng chọn file để import!')
            return
        }

        try {
            setLoading(true)

            // Parse file
            const users = await parseExcelToJSON(file)
            console.log('Parsed users:', users)

            // Call API
            const response = await api.importUsers(users)
            console.log('Import result:', response)

            setResult(response)

            if (response.success > 0) {
                alert(`Import thành công ${response.success} người dùng!`)
            }
        } catch (error: any) {
            console.error('Error importing users:', error)
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi import!'
            alert(`Lỗi: ${errorMsg}`)
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = () => {
        const csv = `username,password,name,email,role,courses
student001,123456,Nguyễn Văn A,student001@student.eiu.edu.vn,STUDENT,CSE301
student002,123456,Trần Thị B,student002@student.eiu.edu.vn,STUDENT,"CSE301,CSE302"
teacher001,123456,Lê Văn C,teacher001@eiu.edu.vn,TEACHER,"CSE301,CSE302"
`
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template_import_users.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 animate-fadeInUp">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Import Users từ Excel/CSV</h1>
                <Button variant="outline" onClick={() => router.push('/admin/users')}>
                    Quay lại
                </Button>
            </div>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        Hướng dẫn sử dụng
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Định dạng file Excel/CSV:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            <li><strong>username</strong>: Tên đăng nhập (bắt buộc)</li>
                            <li><strong>password</strong>: Mật khẩu (bắt buộc)</li>
                            <li><strong>name</strong>: Họ và tên (bắt buộc)</li>
                            <li><strong>email</strong>: Email (tùy chọn)</li>
                            <li><strong>role</strong>: Vai trò - STUDENT, TEACHER, hoặc ADMIN (bắt buộc)</li>
                            <li><strong>courses</strong>: Danh sách lớp, ví dụ: CSE301 hoặc CSE301,CSE302 (tùy chọn)</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Lưu ý:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            <li>File Excel phải có đúng các cột header như mô tả ở trên</li>
                            <li>Dòng đầu tiên phải là header</li>
                            <li>Hỗ trợ cả file .xlsx, .xls và .csv</li>
                            <li>Username phải là duy nhất trong hệ thống</li>
                        </ul>
                    </div>

                    <Button onClick={downloadTemplate} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Tải file mẫu
                    </Button>
                </CardContent>
            </Card>

            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-purple-600" />
                        Upload File
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <Button variant="outline" asChild>
                                <span>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Chọn file CSV/Excel
                                </span>
                            </Button>
                        </label>
                        {file && (
                            <p className="mt-4 text-sm text-gray-600">
                                File đã chọn: <strong>{file.name}</strong>
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleImport}
                        disabled={!file || loading}
                        className="w-full"
                    >
                        {loading ? 'Đang import...' : 'Import Users'}
                    </Button>
                </CardContent>
            </Card>

            {/* Result */}
            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Kết quả Import</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 mb-1">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">Thành công</span>
                                </div>
                                <p className="text-2xl font-bold text-green-700">{result.success}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2 text-red-700 mb-1">
                                    <XCircle className="h-5 w-5" />
                                    <span className="font-semibold">Thất bại</span>
                                </div>
                                <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-semibold text-red-700 mb-2">Lỗi:</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-red-600 max-h-60 overflow-y-auto">
                                    {result.errors.map((error) => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
