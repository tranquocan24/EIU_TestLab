'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, GraduationCap, FileText, Activity, RefreshCw, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

interface DashboardStats {
    totalStudents: number
    totalTeachers: number
    totalExams: number
    todayAttempts: number
}

interface RecentActivity {
    id: string
    type: 'login' | 'exam_created' | 'exam_submitted' | 'user_created'
    userName: string
    description: string
    timestamp: string
}

export default function AdminDashboard() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        totalTeachers: 0,
        totalExams: 0,
        todayAttempts: 0
    })
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated || user?.role.toLowerCase() !== 'admin') {
            router.push('/login')
            return
        }

        loadDashboardData()
    }, [isAuthenticated, user, router])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            const data = await api.getDashboardStats()

            setStats({
                totalStudents: data.totalStudents,
                totalTeachers: data.totalTeachers,
                totalExams: data.totalExams,
                todayAttempts: data.todayAttempts
            })

            setActivities(data.activities || [])
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'login':
                return '🔐'
            case 'exam_created':
                return '📝'
            case 'exam_submitted':
                return '✅'
            case 'user_created':
                return '👤'
            default:
                return '📋'
        }
    }

    const formatTimestamp = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diff = now.getTime() - time.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 1) return 'Vừa xong'
        if (minutes < 60) return `${minutes} phút trước`
        if (hours < 24) return `${hours} giờ trước`
        return `${days} ngày trước`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeInUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-8 rounded-2xl text-center shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Quản trị hệ thống</h1>
                <p className="text-red-100 text-lg">Tổng quan và quản lý toàn bộ hệ thống EIU TestLab</p>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
                <Button variant="outline" onClick={loadDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới dữ liệu
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <GraduationCap className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 font-medium">Tổng số học sinh</div>
                                <div className="text-3xl font-bold text-gray-800">{stats.totalStudents}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 font-medium">Tổng số giáo viên</div>
                                <div className="text-3xl font-bold text-gray-800">{stats.totalTeachers}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <FileText className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 font-medium">Tổng số bài thi</div>
                                <div className="text-3xl font-bold text-gray-800">{stats.totalExams}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <TrendingUp className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 font-medium">Lượt thi hôm nay</div>
                                <div className="text-3xl font-bold text-gray-800">{stats.todayAttempts}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Hoạt động gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activities.length > 0 ? (
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="text-3xl">{getActivityIcon(activity.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-gray-800">
                                            <span className="font-semibold text-red-600">{activity.userName}</span>{' '}
                                            {activity.description}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">{formatTimestamp(activity.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-gray-500 italic">Chưa có hoạt động nào</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
