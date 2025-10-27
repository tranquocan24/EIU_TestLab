'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, TrendingUp, Award, Calendar } from 'lucide-react'

interface ExamResult {
  id: string
  examId: string
  examTitle: string
  subject: string
  score: number
  totalQuestions: number
  correctAnswers: number
  completedAt: string
  duration: number
}

export default function StudentResultsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [results, setResults] = useState<ExamResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0
  })

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== 'student') {
      router.push('/login')
      return
    }

    loadResults()
  }, [isAuthenticated, user, router])

  useEffect(() => {
    filterResults()
  }, [results, subjectFilter, searchTerm])

  const loadResults = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await apiClient.getMyResults()

      // Mock data
      const mockResults: ExamResult[] = [
        {
          id: '1',
          examId: 'exam1',
          examTitle: 'Kiểm tra giữa kỳ - Lập trình Web',
          subject: 'Lập trình Web',
          score: 90,
          totalQuestions: 30,
          correctAnswers: 27,
          completedAt: new Date(Date.now() - 86400000).toISOString(),
          duration: 60
        },
        {
          id: '2',
          examId: 'exam2',
          examTitle: 'Bài tập JavaScript Nâng cao',
          subject: 'Lập trình Web',
          score: 85,
          totalQuestions: 25,
          correctAnswers: 21,
          completedAt: new Date(Date.now() - 172800000).toISOString(),
          duration: 45
        },
        {
          id: '3',
          examId: 'exam3',
          examTitle: 'Cơ sở dữ liệu - SQL cơ bản',
          subject: 'Cơ sở dữ liệu',
          score: 75,
          totalQuestions: 40,
          correctAnswers: 30,
          completedAt: new Date(Date.now() - 259200000).toISOString(),
          duration: 90
        }
      ]

      setResults(mockResults)
      setFilteredResults(mockResults)

      // Calculate stats
      const total = mockResults.length
      const avg = mockResults.reduce((sum, r) => sum + r.score, 0) / total
      const highest = Math.max(...mockResults.map(r => r.score))

      setStats({
        totalExams: total,
        averageScore: Math.round(avg),
        highestScore: highest
      })
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResults = () => {
    let filtered = [...results]

    if (subjectFilter && subjectFilter !== 'all') {
      filtered = filtered.filter(result => result.subject === subjectFilter)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(result =>
        result.examTitle.toLowerCase().includes(search) ||
        result.subject.toLowerCase().includes(search)
      )
    }

    setFilteredResults(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Xuất sắc', color: 'bg-green-500' }
    if (score >= 80) return { text: 'Giỏi', color: 'bg-blue-500' }
    if (score >= 70) return { text: 'Khá', color: 'bg-yellow-500' }
    if (score >= 60) return { text: 'Trung bình', color: 'bg-orange-500' }
    return { text: 'Yếu', color: 'bg-red-500' }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mb-4"></div>
        <p className="text-gray-600">Đang tải kết quả...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white rounded-2xl p-8 text-center shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Kết quả của tôi</h2>
        <p className="text-blue-100 text-lg">Xem lại các bài thi đã hoàn thành</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalExams}</div>
              <div className="text-sm text-gray-600 font-medium">Bài thi đã làm</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{stats.averageScore}%</div>
              <div className="text-sm text-gray-600 font-medium">Điểm trung bình</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{stats.highestScore}%</div>
              <div className="text-sm text-gray-600 font-medium">Điểm cao nhất</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={subjectFilter || 'all'} onValueChange={setSubjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả môn học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả môn học</SelectItem>
              <SelectItem value="Lập trình Web">Lập trình Web</SelectItem>
              <SelectItem value="Cơ sở dữ liệu">Cơ sở dữ liệu</SelectItem>
              <SelectItem value="Mạng máy tính">Mạng máy tính</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Tìm kiếm bài thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Results List */}
      {filteredResults.length > 0 ? (
        <div className="space-y-4">
          {filteredResults.map((result) => {
            const badge = getScoreBadge(result.score)
            return (
              <Card
                key={result.id}
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/student/results/${result.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 flex-1">
                        {result.examTitle}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} text-white`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-blue-600 font-medium mb-3">{result.subject}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{result.totalQuestions} câu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(result.completedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>{result.correctAnswers}/{result.totalQuestions} đúng</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>{((result.correctAnswers / result.totalQuestions) * 100).toFixed(0)}% chính xác</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Card className={`p-6 text-center min-w-[120px] border-2 ${getScoreColor(result.score)}`}>
                      <div className={`text-4xl font-bold mb-1 ${result.score >= 80 ? 'text-green-600' : result.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.score}%
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Điểm số</div>
                    </Card>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/student/results/${result.id}`)
                      }}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="h-24 w-24 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có kết quả nào</h3>
          <p className="text-gray-500 mb-6">
            Bạn chưa hoàn thành bài thi nào. Hãy vào danh sách bài thi để bắt đầu!
          </p>
          <Button
            onClick={() => router.push('/student/exams')}
            className="bg-gradient-to-r from-[#112444] to-[#1a365d]"
          >
            Xem danh sách bài thi
          </Button>
        </Card>
      )}
    </div>
  )
}
