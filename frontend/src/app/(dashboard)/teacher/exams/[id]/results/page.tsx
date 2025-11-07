'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Search, Trophy, Users, TrendingUp, Award } from 'lucide-react'
import api from '@/lib/api'

interface StudentResult {
  id: string
  attemptNumber: number
  studentId: string
  studentName: string
  studentUsername: string
  score: number
  totalQuestions: number
  correctAnswers: number
  submittedAt: string
  timeSpent: number
  status: string
}

interface ExamInfo {
  id: string
  title: string
  subject: string
  duration: number
  totalQuestions: number
}

export default function ExamResultsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const { user, isAuthenticated } = useAuth()

  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [results, setResults] = useState<StudentResult[]>([])
  const [filteredResults, setFilteredResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passRate: 0
  })

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== 'teacher') {
      router.push('/login')
      return
    }

    if (examId) {
      loadExamResults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router, examId])

  useEffect(() => {
    filterResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, searchTerm])

  const loadExamResults = async () => {
    try {
      setLoading(true)
      console.log('Loading exam results for:', examId)

      // Load exam info
      const examData = await api.getExamById(examId)
      setExam({
        id: examData.id,
        title: examData.title,
        subject: examData.subject || 'N/A',
        duration: examData.duration || 60,
        totalQuestions: examData.questions?.length || 0
      })

      // Load attempts/results
      const attemptsData = await api.getExamAttempts(examId)
      console.log('Attempts data:', attemptsData)

      const transformedResults: StudentResult[] = attemptsData
        .filter((attempt: { status: string }) => attempt.status === 'SUBMITTED' || attempt.status === 'GRADED')
        .map((attempt: {
          id: string
          attemptNumber: number
          student: { id: string; name: string; username: string }
          score: number
          submittedAt: string
          timeSpent: number
          status: string
          answers?: { isCorrect: boolean }[]
        }) => ({
          id: attempt.id,
          attemptNumber: attempt.attemptNumber || 1,
          studentId: attempt.student.id,
          studentName: attempt.student.name,
          studentUsername: attempt.student.username,
          score: attempt.score || 0,
          totalQuestions: examData.questions?.length || 0,
          correctAnswers: attempt.answers?.filter(a => a.isCorrect).length || 0,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent || 0,
          status: attempt.status
        }))

      setResults(transformedResults)
      calculateStats(transformedResults)
    } catch (error) {
      console.error('Failed to load exam results:', error)
      alert('Không thể tải kết quả bài thi')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (resultsData: StudentResult[]) => {
    if (resultsData.length === 0) {
      setStats({
        totalStudents: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0
      })
      return
    }

    const scores = resultsData.map(r => r.score)
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const highest = Math.max(...scores)
    const lowest = Math.min(...scores)
    const passed = resultsData.filter(r => r.score >= 60).length
    const passRate = (passed / resultsData.length) * 100

    setStats({
      totalStudents: resultsData.length,
      averageScore: Math.round(avg * 10) / 10,
      highestScore: Math.round(highest * 10) / 10,
      lowestScore: Math.round(lowest * 10) / 10,
      passRate: Math.round(passRate * 10) / 10
    })
  }

  const filterResults = () => {
    if (!searchTerm.trim()) {
      setFilteredResults(results)
      return
    }

    const search = searchTerm.toLowerCase()
    const filtered = results.filter(result =>
      result.studentName.toLowerCase().includes(search) ||
      result.studentUsername.toLowerCase().includes(search)
    )
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Xuất sắc', color: 'bg-green-500' }
    if (score >= 80) return { text: 'Giỏi', color: 'bg-blue-500' }
    if (score >= 70) return { text: 'Khá', color: 'bg-yellow-500' }
    if (score >= 60) return { text: 'Trung bình', color: 'bg-orange-500' }
    return { text: 'Yếu', color: 'bg-red-500' }
  }

  const exportToCSV = () => {
    const headers = ['STT', 'Họ tên', 'Username', 'Lần thi', 'Điểm', 'Câu đúng', 'Thời gian', 'Ngày nộp']
    const rows = filteredResults.map((result, index) => [
      index + 1,
      result.studentName,
      result.studentUsername,
      result.attemptNumber,
      result.score,
      `${result.correctAnswers}/${result.totalQuestions}`,
      formatDuration(result.timeSpent),
      formatDate(result.submittedAt)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${exam?.title || 'exam'}_results.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mb-4"></div>
        <p className="text-gray-600">Đang tải kết quả...</p>
      </div>
    )
  }

  if (!exam) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy đề thi</h3>
        <Button onClick={() => router.push('/teacher/exams')}>
          Quay lại danh sách
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/teacher/exams')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Kết quả bài thi</h2>
            <p className="text-gray-600">{exam.title}</p>
            <p className="text-sm text-blue-600">{exam.subject}</p>
          </div>
        </div>
        <Button onClick={exportToCSV} className="bg-gradient-to-r from-[#112444] to-[#1a365d]">
          <Download className="h-4 w-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                <div className="text-xs text-gray-600">Học sinh</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.averageScore}%</div>
                <div className="text-xs text-gray-600">Điểm TB</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.highestScore}%</div>
                <div className="text-xs text-gray-600">Cao nhất</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.lowestScore}%</div>
                <div className="text-xs text-gray-600">Thấp nhất</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.passRate}%</div>
                <div className="text-xs text-gray-600">Tỷ lệ đậu</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách kết quả ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Họ tên</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Lần thi</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Điểm</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Xếp loại</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Câu đúng</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thời gian</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, index) => {
                    const badge = getScoreBadge(result.score)
                    return (
                      <tr key={result.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{result.studentName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.studentUsername}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            Lần {result.attemptNumber}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(result.score)}`}>
                            {result.score.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`${badge.color} text-white text-xs`}>
                            {badge.text}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {result.correctAnswers}/{result.totalQuestions}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {formatDuration(result.timeSpent)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(result.submittedAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có kết quả</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'Không tìm thấy học sinh phù hợp'
                  : 'Chưa có học sinh nào hoàn thành bài thi này'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
