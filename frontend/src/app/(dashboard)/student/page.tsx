'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExamStats {
  totalExams: number
  completedExams: number
  averageScore: number
}

interface RecentExam {
  id: string
  title: string
  subject: string
  score: number
  completedAt: string
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<ExamStats>({ totalExams: 0, completedExams: 0, averageScore: 0 })
  const [recentExams, setRecentExams] = useState<RecentExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      setStats({
        totalExams: 8,
        completedExams: 5,
        averageScore: 8.2
      })

      setRecentExams([
        {
          id: '1',
          title: 'Kiểm tra giữa kỳ - Lập trình Web',
          subject: 'Lập trình Web',
          score: 9,
          completedAt: '2025-01-05 14:30'
        },
        {
          id: '2',
          title: 'Bài tập JavaScript Nâng cao',
          subject: 'Lập trình Web',
          score: 8.5,
          completedAt: '2025-01-03 16:15'
        },
        {
          id: '3',
          title: 'Cơ sở dữ liệu - SQL cơ bản',
          subject: 'Cơ sở dữ liệu',
          score: 7,
          completedAt: '2025-01-01 10:20'
        }
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-2">EIU TestLab - Trang chủ sinh viên</h1>
        <p className="text-blue-100">Chào mừng bạn đến với hệ thống thi trực tuyến của EIU</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">📚</div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{stats.totalExams}</div>
                <div className="text-gray-600 font-medium">Bài thi khả dụng</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">✅</div>
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.completedExams}</div>
                <div className="text-gray-600 font-medium">Đã hoàn thành</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">⭐</div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{stats.averageScore}</div>
                <div className="text-gray-600 font-medium">Điểm trung bình</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Bài thi gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExams.length > 0 ? (
            <div className="space-y-4">
              {recentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">{exam.title}</h4>
                    <p className="text-blue-600 text-sm font-medium">{exam.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{exam.score}/10</div>
                    <div className="text-gray-500 text-sm">{formatDateTime(exam.completedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 italic">Chưa có bài thi nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Thông báo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="text-2xl">🎉</div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Chào mừng bạn!</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Chào mừng bạn đến với hệ thống thi online. Hãy kiểm tra danh sách bài thi để bắt đầu.
                </p>
                <span className="text-gray-400 text-xs mt-2 block">Hôm nay</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}