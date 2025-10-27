'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, TrendingUp, TrendingDown, Award, Download, RefreshCw, Eye, Search } from 'lucide-react'

interface ExamResult {
    id: string
    studentId: string
    studentName: string
    class: string
    score: number
    timeSpent: number
    submittedAt: string
}

interface ExamOption {
    id: string
    title: string
}

export default function ViewResultsPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [loading, setLoading] = useState(false)
    const [selectedExam, setSelectedExam] = useState('')
    const [exams, setExams] = useState<ExamOption[]>([])
    const [results, setResults] = useState<ExamResult[]>([])
    const [filteredResults, setFilteredResults] = useState<ExamResult[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [classFilter, setClassFilter] = useState('all')
    const [scoreRangeFilter, setScoreRangeFilter] = useState('all')

    useEffect(() => {
        if (!isAuthenticated || user?.role.toLowerCase() !== 'teacher') {
            router.push('/login')
            return
        }

        loadExams()
    }, [isAuthenticated, user, router])

    useEffect(() => {
        if (selectedExam) {
            loadResults(selectedExam)
        }
    }, [selectedExam])

    useEffect(() => {
        filterResults()
    }, [results, searchQuery, classFilter, scoreRangeFilter])

    const loadExams = async () => {
        try {
            // TODO: Replace with actual API call
            const mockExams: ExamOption[] = [
                { id: '1', title: 'Kiểm tra giữa kỳ - Lập trình Web' },
                { id: '2', title: 'Bài tập JavaScript cơ bản' },
                { id: '4', title: 'SQL nâng cao' }
            ]
            setExams(mockExams)
        } catch (error) {
            console.error('Error loading exams:', error)
        }
    }

    const loadResults = async (examId: string) => {
        try {
            setLoading(true)
            // TODO: Replace with actual API call
            const mockResults: ExamResult[] = [
                {
                    id: '1',
                    studentId: 'SV001',
                    studentName: 'Nguyễn Văn A',
                    class: 'CIT0001',
                    score: 9.0,
                    timeSpent: 45,
                    submittedAt: '2025-01-20 14:30:00'
                },
                {
                    id: '2',
                    studentId: 'SV002',
                    studentName: 'Trần Thị B',
                    class: 'CIT0001',
                    score: 8.5,
                    timeSpent: 50,
                    submittedAt: '2025-01-20 14:35:00'
                },
                {
                    id: '3',
                    studentId: 'SV003',
                    studentName: 'Lê Văn C',
                    class: 'CIT0002',
                    score: 7.0,
                    timeSpent: 55,
                    submittedAt: '2025-01-20 14:40:00'
                },
                {
                    id: '4',
                    studentId: 'SV004',
                    studentName: 'Phạm Thị D',
                    class: 'CIT0001',
                    score: 9.5,
                    timeSpent: 40,
                    submittedAt: '2025-01-20 14:25:00'
                },
                {
                    id: '5',
                    studentId: 'SV005',
                    studentName: 'Hoàng Văn E',
                    class: 'CIT0002',
                    score: 6.5,
                    timeSpent: 60,
                    submittedAt: '2025-01-20 14:45:00'
                }
            ]

            setResults(mockResults)
        } catch (error) {
            console.error('Error loading results:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterResults = () => {
        let filtered = [...results]

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(r =>
                r.studentName.toLowerCase().includes(query) ||
                r.studentId.toLowerCase().includes(query)
            )
        }

        // Class filter
        if (classFilter && classFilter !== 'all') {
            filtered = filtered.filter(r => r.class === classFilter)
        }

        // Score range filter
        if (scoreRangeFilter && scoreRangeFilter !== 'all') {
            filtered = filtered.filter(r => {
                const scorePercent = r.score * 10
                switch (scoreRangeFilter) {
                    case 'excellent': return scorePercent >= 90
                    case 'good': return scorePercent >= 80 && scorePercent < 90
                    case 'average': return scorePercent >= 70 && scorePercent < 80
                    case 'weak': return scorePercent >= 60 && scorePercent < 70
                    case 'poor': return scorePercent < 60
                    default: return true
                }
            })
        }

        setFilteredResults(filtered)
    }

    const getScoreBadge = (score: number) => {
        const scorePercent = score * 10
        if (scorePercent >= 90) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Xuất sắc</span>
        if (scorePercent >= 80) return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Giỏi</span>
        if (scorePercent >= 70) return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Khá</span>
        if (scorePercent >= 60) return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Trung bình</span>
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Yếu</span>
    }

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString)
        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const stats = selectedExam && results.length > 0 ? {
        total: results.length,
        average: (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1),
        highest: Math.max(...results.map(r => r.score)).toFixed(1),
        lowest: Math.min(...results.map(r => r.score)).toFixed(1)
    } : null

    const handleExportResults = () => {
        alert('Chức năng xuất Excel đang được phát triển!')
    }

    return (
        <div className="space-y-6 animate-fadeInUp">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Kết quả thi sinh viên</h1>
                    <p className="text-gray-600 mt-1">Xem và phân tích kết quả thi của sinh viên</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportResults}>
                        <Download className="h-4 w-4 mr-2" />
                        Xuất Excel
                    </Button>
                    <Button variant="outline" onClick={() => selectedExam && loadResults(selectedExam)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Exam Selector */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Chọn bài thi để xem kết quả:</label>
                        <Select value={selectedExam} onValueChange={setSelectedExam}>
                            <SelectTrigger className="w-full md:w-96">
                                <SelectValue placeholder="-- Chọn bài thi --" />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map((exam) => (
                                    <SelectItem key={exam.id} value={exam.id}>
                                        {exam.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedExam ? (
                <>
                    {/* Statistics */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <Users className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-medium">Sinh viên tham gia</div>
                                            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-green-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 rounded-lg">
                                            <TrendingUp className="h-8 w-8 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-medium">Điểm trung bình</div>
                                            <div className="text-2xl font-bold text-gray-800">{stats.average}/10</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 rounded-lg">
                                            <Award className="h-8 w-8 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-medium">Điểm cao nhất</div>
                                            <div className="text-2xl font-bold text-gray-800">{stats.highest}/10</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-orange-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-100 rounded-lg">
                                            <TrendingDown className="h-8 w-8 text-orange-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-medium">Điểm thấp nhất</div>
                                            <div className="text-2xl font-bold text-gray-800">{stats.lowest}/10</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Filters */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm theo tên hoặc mã SV..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={classFilter} onValueChange={setClassFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tất cả lớp" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả lớp</SelectItem>
                                        <SelectItem value="CIT0001">CIT0001</SelectItem>
                                        <SelectItem value="CIT0002">CIT0002</SelectItem>
                                        <SelectItem value="CIT0003">CIT0003</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={scoreRangeFilter} onValueChange={setScoreRangeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tất cả điểm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả điểm</SelectItem>
                                        <SelectItem value="excellent">Xuất sắc (90-100%)</SelectItem>
                                        <SelectItem value="good">Giỏi (80-89%)</SelectItem>
                                        <SelectItem value="average">Khá (70-79%)</SelectItem>
                                        <SelectItem value="weak">Trung bình (60-69%)</SelectItem>
                                        <SelectItem value="poor">Yếu (&lt;60%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Table */}
                    {loading ? (
                        <Card>
                            <CardContent className="p-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Đang tải kết quả thi...</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : filteredResults.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Danh sách kết quả ({filteredResults.length})</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">STT</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Mã SV</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Họ tên</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Lớp</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Điểm</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Thời gian</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày nộp</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredResults.map((result, index) => (
                                                <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 text-gray-800">{index + 1}</td>
                                                    <td className="py-3 px-4 text-gray-800 font-medium">{result.studentId}</td>
                                                    <td className="py-3 px-4 text-gray-800">{result.studentName}</td>
                                                    <td className="py-3 px-4 text-gray-600">{result.class}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-purple-600">{result.score}/10</span>
                                                            {getScoreBadge(result.score)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600">{result.timeSpent} phút</td>
                                                    <td className="py-3 px-4 text-gray-600">{formatDateTime(result.submittedAt)}</td>
                                                    <td className="py-3 px-4">
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Xem
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-12">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">📊</div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có kết quả thi</h3>
                                    <p className="text-gray-500">
                                        {searchQuery || classFilter !== 'all' || scoreRangeFilter !== 'all'
                                            ? 'Không tìm thấy kết quả phù hợp với bộ lọc'
                                            : 'Chưa có sinh viên nào làm bài thi này'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <Card>
                    <CardContent className="p-12">
                        <div className="text-center">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Chọn bài thi để xem kết quả</h3>
                            <p className="text-gray-500">Vui lòng chọn một bài thi từ danh sách trên để xem kết quả chi tiết</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
