'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Users, FileText, TrendingUp, Download, Calendar } from 'lucide-react'

interface LoginStats {
    date: string
    logins: number
}

interface ExamStats {
    subject: string
    totalExams: number
    totalSubmissions: number
    averageScore: number
}

export default function AdminStatsPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState('7days')
    const [loginStats, setLoginStats] = useState<LoginStats[]>([])
    const [examStats, setExamStats] = useState<ExamStats[]>([])

    useEffect(() => {
        if (!isAuthenticated || user?.role.toLowerCase() !== 'admin') {
            router.push('/login')
            return
        }

        loadStats()
    }, [isAuthenticated, user, router])

    useEffect(() => {
        loadStats()
    }, [timeRange])

    const loadStats = async () => {
        try {
            setLoading(true)
            // TODO: Replace with actual API call

            // Mock login stats
            const mockLoginStats: LoginStats[] = [
                { date: '2025-01-21', logins: 45 },
                { date: '2025-01-22', logins: 52 },
                { date: '2025-01-23', logins: 38 },
                { date: '2025-01-24', logins: 61 },
                { date: '2025-01-25', logins: 48 },
                { date: '2025-01-26', logins: 55 },
                { date: '2025-01-27', logins: 42 }
            ]

            // Mock exam stats
            const mockExamStats: ExamStats[] = [
                {
                    subject: 'Lập trình Web',
                    totalExams: 12,
                    totalSubmissions: 345,
                    averageScore: 7.8
                },
                {
                    subject: 'Cơ sở dữ liệu',
                    totalExams: 8,
                    totalSubmissions: 256,
                    averageScore: 8.2
                },
                {
                    subject: 'Mạng máy tính',
                    totalExams: 10,
                    totalSubmissions: 298,
                    averageScore: 7.5
                },
                {
                    subject: 'Kỹ thuật phần mềm',
                    totalExams: 6,
                    totalSubmissions: 187,
                    averageScore: 8.0
                },
                {
                    subject: 'Hệ điều hành',
                    totalExams: 9,
                    totalSubmissions: 234,
                    averageScore: 7.6
                }
            ]

            setLoginStats(mockLoginStats)
            setExamStats(mockExamStats)
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }

    const totalLogins = loginStats.reduce((sum, stat) => sum + stat.logins, 0)
    const averageLogins = loginStats.length > 0 ? Math.round(totalLogins / loginStats.length) : 0
    const maxLogins = Math.max(...loginStats.map(s => s.logins), 0)

    const handleExportStats = () => {
        alert('Chức năng xuất báo cáo đang được phát triển!')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thống kê...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeInUp">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Thống kê hệ thống</h1>
                <div className="flex gap-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">7 ngày qua</SelectItem>
                            <SelectItem value="30days">30 ngày qua</SelectItem>
                            <SelectItem value="90days">90 ngày qua</SelectItem>
                            <SelectItem value="year">Năm nay</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExportStats}>
                        <Download className="h-4 w-4 mr-2" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            {/* Login Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Thống kê đăng nhập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                                <div className="text-sm text-gray-600">Tổng lượt đăng nhập</div>
                                <div className="text-2xl font-bold text-blue-600">{totalLogins}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                                <div className="text-sm text-gray-600">Trung bình/ngày</div>
                                <div className="text-2xl font-bold text-green-600">{averageLogins}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                                <div className="text-sm text-gray-600">Cao nhất</div>
                                <div className="text-2xl font-bold text-purple-600">{maxLogins}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className="space-y-2">
                        {loginStats.map((stat, index) => {
                            const percentage = maxLogins > 0 ? (stat.logins / maxLogins) * 100 : 0
                            return (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-20 text-sm text-gray-600 font-medium">
                                        {formatDate(stat.date)}
                                    </div>
                                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        >
                                            {percentage > 15 && (
                                                <span className="text-white text-sm font-semibold">{stat.logins}</span>
                                            )}
                                        </div>
                                        {percentage <= 15 && (
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 text-sm font-semibold">
                                                {stat.logins}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Exam Statistics by Subject */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Thống kê theo môn học
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Môn học</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Số đề thi</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Lượt thi</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Điểm TB</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phân bố</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examStats.map((stat, index) => {
                                    const maxSubmissions = Math.max(...examStats.map(s => s.totalSubmissions))
                                    const percentage = maxSubmissions > 0 ? (stat.totalSubmissions / maxSubmissions) * 100 : 0

                                    return (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-gray-800 font-medium">{stat.subject}</td>
                                            <td className="py-3 px-4 text-gray-800">{stat.totalExams}</td>
                                            <td className="py-3 px-4 text-gray-800">{stat.totalSubmissions}</td>
                                            <td className="py-3 px-4">
                                                <span className="font-bold text-purple-600">{stat.averageScore}/10</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <FileText className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 font-medium">Tổng đề thi</div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {examStats.reduce((sum, s) => sum + s.totalExams, 0)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 font-medium">Tổng lượt thi</div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {examStats.reduce((sum, s) => sum + s.totalSubmissions, 0)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <TrendingUp className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 font-medium">Điểm TB chung</div>
                                <div className="text-2xl font-bold text-gray-800">
                                    {examStats.length > 0
                                        ? (examStats.reduce((sum, s) => sum + s.averageScore, 0) / examStats.length).toFixed(1)
                                        : '0'}/10
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
