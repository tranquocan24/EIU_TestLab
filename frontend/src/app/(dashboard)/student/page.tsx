'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

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

interface Attempt {
  id: string
  exam: {
    id: string
    title: string
    subject: string
  }
  score: number
  submittedAt: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<ExamStats>({ totalExams: 0, completedExams: 0, averageScore: 0 })
  const [recentExams, setRecentExams] = useState<RecentExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== 'student') {
      router.push('/login')
      return
    }
    loadDashboardData()
  }, [isAuthenticated, user, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log('Loading student dashboard data...')

      // Get all exams available to student
      const examsResponse = await api.getExams()
      console.log('Available exams:', examsResponse)

      // Get student's attempts
      const attemptsResponse = await api.getMyAttempts()
      console.log('Student attempts:', attemptsResponse)

      const attempts = attemptsResponse as Attempt[]

      // Calculate stats
      const totalExams = examsResponse.length
      const completedExams = attempts.length

      let averageScore = 0
      if (attempts.length > 0) {
        const totalScore = attempts.reduce((sum: number, attempt: Attempt) => {
          return sum + (attempt.score || 0)
        }, 0)
        averageScore = Math.round((totalScore / attempts.length) * 10) / 10
      }

      setStats({
        totalExams,
        completedExams,
        averageScore
      })

      // Get recent 3 attempts
      const recentAttempts = attempts
        .sort((a: Attempt, b: Attempt) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
        .slice(0, 3)
        .map((attempt: Attempt) => ({
          id: attempt.id,
          title: attempt.exam.title,
          subject: attempt.exam.subject,
          score: attempt.score || 0,
          completedAt: attempt.submittedAt
        }))

      console.log('Recent exams:', recentAttempts)
      setRecentExams(recentAttempts)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty data on error
      setStats({ totalExams: 0, completedExams: 0, averageScore: 0 })
      setRecentExams([])
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