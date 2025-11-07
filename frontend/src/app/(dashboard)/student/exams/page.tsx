'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface Exam {
  id: string
  title: string
  subject: string
  duration: number
  status: string
  maxAttempts?: number | null // null = không giới hạn
  startTime?: string
  endTime?: string
  createdBy: {
    id: string
    name: string
    username: string
  }
  _count: {
    questions: number
    attempts: number
  }
}

interface DisplayExam {
  id: string
  title: string
  subject: string
  duration: number
  questionCount: number
  status: 'available' | 'completed' | 'expired'
  maxAttempts?: number | null
  timeLeft?: string
  score?: number
  completedAt?: string
  createdBy: string
  attemptCount: number
  startTime?: string
  endTime?: string
}

export default function StudentExamList() {
  const router = useRouter()
  const { user } = useAuth()
  const [exams, setExams] = useState<DisplayExam[]>([])
  const [filteredExams, setFilteredExams] = useState<DisplayExam[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState<DisplayExam | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadExamList()
  }, [])

  useEffect(() => {
    const filtered = exams.filter(exam => {
      const matchSubject = !subjectFilter || exam.subject === subjectFilter
      const matchStatus = !statusFilter || exam.status === statusFilter
      const matchSearch = !searchTerm ||
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())

      return matchSubject && matchStatus && matchSearch
    })

    setFilteredExams(filtered)
  }, [exams, subjectFilter, statusFilter, searchTerm])

  const loadExamList = async () => {
    try {
      setLoading(true)
      console.log('Loading exams for student...')

      // Call API to get exams (backend will filter by student's courses)
      const response = await api.getExams()
      console.log('Exams from API:', response)

      // Get student's attempts to check completed exams
      const myAttempts = await api.getMyAttempts()
      console.log('My attempts:', myAttempts)

      // Create a map of examId -> attempt for quick lookup
      const attemptMap = new Map(
        myAttempts.map((attempt: any) => [attempt.exam.id, attempt])
      )

      // Transform backend data to display format
      const displayExams: DisplayExam[] = response.map((exam: Exam) => {
        // Calculate exam status
        let status: 'available' | 'completed' | 'expired' = 'available'
        let timeLeft = ''

        const now = new Date()

        // Check if exam has start time and hasn't started yet
        if (exam.startTime) {
          const startDate = new Date(exam.startTime)
          if (startDate > now) {
            // Exam hasn't started yet
            const diff = startDate.getTime() - now.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

            if (days > 0) {
              timeLeft = `Bắt đầu sau ${days} ngày`
            } else if (hours > 0) {
              timeLeft = `Bắt đầu sau ${hours} giờ`
            } else {
              timeLeft = 'Sắp bắt đầu'
            }
            status = 'expired' // Use expired status to disable button
          }
        }

        // Check if exam has end time and if it's expired
        if (status !== 'expired' && exam.endTime) {
          const endDate = new Date(exam.endTime)
          if (endDate < now) {
            status = 'expired'
            timeLeft = 'Đã hết hạn'
          } else if (!timeLeft) {
            // Calculate time left to end
            const diff = endDate.getTime() - now.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

            if (days > 0) {
              timeLeft = `Còn ${days} ngày`
            } else if (hours > 0) {
              timeLeft = `Còn ${hours} giờ`
            } else {
              timeLeft = 'Sắp hết hạn'
            }
          }
        } else if (!timeLeft) {
          // No end time = always available
          timeLeft = 'Không giới hạn'
        }

        // Check if student has completed this exam
        const myAttempt = attemptMap.get(exam.id)

        // Only mark as completed if:
        // 1. Student has attempts AND
        // 2. maxAttempts is not null (not unlimited) AND
        // 3. Student has reached maxAttempts limit
        if (myAttempt) {
          // Get student's attempt count for this exam
          const studentAttemptsCount = myAttempts.filter(
            (a: any) => a.exam.id === exam.id &&
              (a.status === 'SUBMITTED' || a.status === 'GRADED')
          ).length

          // Check if max attempts reached (only if maxAttempts is set)
          if (exam.maxAttempts !== null && exam.maxAttempts !== undefined) {
            if (studentAttemptsCount >= exam.maxAttempts) {
              status = 'completed' // Max attempts reached
            }
            // else: Can still retake
          }
          // else: maxAttempts is null (unlimited), don't mark as completed
        }

        return {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          duration: exam.duration,
          questionCount: exam._count.questions,
          maxAttempts: exam.maxAttempts,
          status,
          timeLeft,
          createdBy: exam.createdBy.name,
          attemptCount: exam._count.attempts,
          score: myAttempt?.score,
          completedAt: myAttempt?.submittedAt,
          startTime: exam.startTime,
          endTime: exam.endTime,
        }
      })

      console.log('Transformed exams:', displayExams)
      setExams(displayExams)
    } catch (error) {
      console.error('Error loading exam list:', error)
      alert('Có lỗi khi tải danh sách bài thi. Vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      'available': 'Có thể làm',
      'completed': 'Đã hoàn thành',
      'expired': 'Hết hạn'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      'available': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'expired': 'bg-red-100 text-red-800'
    }
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
  }

  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return ''
    const date = new Date(dateTimeString)
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleTakeExam = (exam: DisplayExam) => {
    setSelectedExam(exam)
    setShowModal(true)
  }

  const startExam = () => {
    if (selectedExam) {
      // Navigate to exam page
      console.log('Starting exam:', selectedExam.id)
      router.push(`/student/exam?id=${selectedExam.id}`)
      setShowModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách bài thi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-2">Danh sách bài thi</h1>
        <p className="text-blue-100">Chọn bài thi để bắt đầu làm bài</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={subjectFilter || 'all'} onValueChange={(value) => setSubjectFilter(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả môn học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn học</SelectItem>
                {/* Dynamically generate subjects from exams */}
                {Array.from(new Set(exams.map(e => e.subject))).map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="available">Có thể làm</SelectItem>
                <SelectItem value="completed">Đã hoàn thành</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Tìm kiếm bài thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exam List */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 mb-2">
                      {exam.title}
                    </CardTitle>
                    <p className="text-blue-600 font-medium">{exam.subject}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(exam.status)}`}>
                    {getStatusText(exam.status)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span>⏱️</span>
                    <span className="text-gray-600">{exam.duration} phút</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>❓</span>
                    <span className="text-gray-600">{exam.questionCount} câu hỏi</span>
                  </div>
                  {exam.status === 'completed' && exam.completedAt ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <span>📅</span>
                        <span className="text-gray-600">{formatDateTime(exam.completedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>👨‍🏫</span>
                        <span className="text-gray-600">GV: {exam.createdBy}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <span>📅</span>
                        <span className="text-gray-600">Còn {exam.timeLeft}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>👨‍🏫</span>
                        <span className="text-gray-600">GV: {exam.createdBy}</span>
                      </div>
                    </>
                  )}
                </div>

                {exam.status === 'completed' && exam.score && (
                  <div className="text-center">
                    <div className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-bold">
                      {exam.score}%
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {exam.status === 'available' && (
                    <Button
                      onClick={() => handleTakeExam(exam)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      Bắt đầu thi
                    </Button>
                  )}

                  {exam.status === 'completed' && (
                    <>
                      <Button variant="outline" className="flex-1">
                        Xem kết quả
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Chi tiết
                      </Button>
                    </>
                  )}

                  {exam.status === 'expired' && (
                    <Button disabled className="flex-1">
                      Hết hạn
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có bài thi nào</h3>
            <p className="text-gray-500">Hiện tại chưa có bài thi nào khả dụng. Vui lòng liên hệ giáo viên để biết thêm thông tin.</p>
          </CardContent>
        </Card>
      )}

      {/* Exam Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận bắt đầu bài thi</DialogTitle>
            <DialogDescription>
              Vui lòng xem kỹ thông tin bài thi trước khi bắt đầu
            </DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-900 text-lg mb-1">{selectedExam.title}</h3>
                  <p className="text-blue-700 font-medium">{selectedExam.subject}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Thời gian làm bài</p>
                    <p className="font-bold text-gray-800">{selectedExam.duration} phút</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Số câu hỏi</p>
                    <p className="font-bold text-gray-800">{selectedExam.questionCount} câu</p>
                  </div>
                </div>

                {(selectedExam.startTime || selectedExam.endTime) && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                      <span className="mr-2">⏰</span> Thời gian thi
                    </h4>
                    <div className="space-y-1 text-sm">
                      {selectedExam.startTime && (
                        <div className="flex justify-between">
                          <span className="text-amber-700">Bắt đầu:</span>
                          <span className="font-medium text-amber-900">{formatDateTime(selectedExam.startTime)}</span>
                        </div>
                      )}
                      {selectedExam.endTime && (
                        <div className="flex justify-between">
                          <span className="text-amber-700">Kết thúc:</span>
                          <span className="font-medium text-amber-900">{formatDateTime(selectedExam.endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Giảng viên</p>
                  <p className="font-medium text-gray-800">{selectedExam.createdBy}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">📋</span> Quy định thi
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Thời gian làm bài có giới hạn, không thể tạm dừng</li>
                  <li>• Mỗi câu hỏi chỉ có thể chọn một đáp án</li>
                  <li>• Có thể xem lại và thay đổi đáp án trước khi nộp bài</li>
                  <li>• Sau khi nộp bài không thể thay đổi</li>
                  <li>• Không được sử dụng tài liệu bên ngoài</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={startExam} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              Bắt đầu thi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}