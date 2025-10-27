'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Users, TrendingUp, PlusCircle } from 'lucide-react'

interface RecentExam {
  id: string
  title: string
  subject: string
  participants: number
  date: string
}

interface RecentResult {
  studentName: string
  studentId: string
  examTitle: string
  score: number
  submittedAt: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [recentExams, setRecentExams] = useState<RecentExam[]>([])
  const [recentResults, setRecentResults] = useState<RecentResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== 'teacher') {
      router.push('/login')
      return
    }

    loadDashboardData()
  }, [isAuthenticated, user, router])

  const loadDashboardData = async () => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      setRecentExams([
        {
          id: '1',
          title: 'Kiểm tra giữa kỳ - Lập trình Web',
          subject: 'Lập trình Web',
          participants: 25,
          date: '2025-01-05'
        },
        {
          id: '2',
          title: 'Bài tập JavaScript Nâng cao',
          subject: 'Lập trình Web',
          participants: 23,
          date: '2025-01-03'
        },
        {
          id: '3',
          title: 'Cơ sở dữ liệu - SQL Nâng cao',
          subject: 'Cơ sở dữ liệu',
          participants: 28,
          date: '2025-01-02'
        }
      ])

      setRecentResults([
        {
          studentName: 'Nguyễn Văn A',
          studentId: 'SV001',
          examTitle: 'Kiểm tra Lập trình Web',
          score: 9,
          submittedAt: '2025-01-05 14:30'
        },
        {
          studentName: 'Trần Thị B',
          studentId: 'SV002',
          examTitle: 'Bài tập JavaScript',
          score: 8.5,
          submittedAt: '2025-01-05 14:25'
        },
        {
          studentName: 'Lê Văn C',
          studentId: 'SV003',
          examTitle: 'Kiểm tra Lập trình Web',
          score: 7.5,
          submittedAt: '2025-01-05 14:20'
        },
        {
          studentName: 'Phạm Thị D',
          studentId: 'SV004',
          examTitle: 'Cơ sở dữ liệu SQL',
          score: 9.5,
          submittedAt: '2025-01-04 11:15'
        }
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 rounded-2xl text-center shadow-lg">
        <h1 className="text-3xl font-bold mb-2">EIU TestLab - Trang chủ giáo viên</h1>
        <p className="text-purple-100 text-lg">Quản lý đề thi và theo dõi kết quả sinh viên trên nền tảng EIU TestLab</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-purple-500"
          onClick={() => router.push('/teacher/create')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <PlusCircle className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Tạo bài thi</div>
                <div className="text-lg font-bold text-gray-800">Tạo mới</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500"
          onClick={() => router.push('/teacher/exams')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Quản lý đề thi</div>
                <div className="text-lg font-bold text-gray-800">{recentExams.length} bài thi</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-green-500"
          onClick={() => router.push('/teacher/results')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Kết quả mới</div>
                <div className="text-lg font-bold text-gray-800">{recentResults.length} bài nộp</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Sinh viên</div>
                <div className="text-lg font-bold text-gray-800">
                  {recentExams.reduce((sum, exam) => sum + exam.participants, 0)} học sinh
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Đề thi gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExams.length > 0 ? (
            <div className="space-y-4">
              {recentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">{exam.title}</h4>
                    <p className="text-purple-600 text-sm font-medium">{exam.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{exam.participants} học sinh</div>
                    <div className="text-gray-500 text-sm">{formatDate(exam.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 italic">Chưa có đề thi nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Kết quả mới nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {recentResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Họ tên</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Đề thi</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Thời gian nộp</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.map((result) => (
                    <tr key={`${result.studentId}-${result.examTitle}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800">{result.studentName}</td>
                      <td className="py-3 px-4 text-gray-600">{result.examTitle}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDateTime(result.submittedAt)}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-purple-600">{result.score}/10</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-500 italic">Chưa có kết quả nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
