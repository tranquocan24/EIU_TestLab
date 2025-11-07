'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import api from '@/lib/api'

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  questionText: string
  options: Option[]
  points: number
  order: number
}

interface Exam {
  id: string
  title: string
  subject: string
  duration: number
  questions: Question[]
}

export default function ExamTakingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('id')

  console.log('[ExamPage] Mounted with examId:', examId)
  console.log('[ExamPage] Search params:', searchParams.toString())

  const [exam, setExam] = useState<Exam | null>(null)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    console.log('[useEffect] examId:', examId, 'hasLoaded:', hasLoadedRef.current)
    if (examId && !hasLoadedRef.current) {
      console.log('[useEffect] Calling loadExam')
      hasLoadedRef.current = true
      loadExam(examId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  const handleSubmit = async () => {
    if (!attemptId) {
      alert('Lỗi: Không tìm thấy phiên làm bài')
      return
    }

    try {
      // Calculate time spent (in minutes)
      const totalTime = (exam?.duration || 0) * 60
      const timeSpent = Math.floor((totalTime - timeRemaining) / 60)

      console.log('=== SUBMITTING EXAM ===')
      console.log('Attempt ID:', attemptId)
      console.log('Time spent:', timeSpent, 'minutes')
      console.log('Total answers:', Object.keys(answers).length)
      console.log('Answers:', answers)

      // Submit all answers first
      let successCount = 0
      let errorCount = 0
      
      for (const [questionId, optionId] of Object.entries(answers)) {
        try {
          console.log(`Submitting answer for question ${questionId}: ${optionId}`)
          await api.submitAnswer(attemptId, questionId, optionId)
          successCount++
          console.log(`✓ Answer ${successCount} submitted successfully`)
        } catch (error: unknown) {
          errorCount++
          console.error(`✗ Error submitting answer for question ${questionId}:`, error)
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { status?: number; data?: unknown } }
            console.error('Error details:', {
              status: axiosError.response?.status,
              data: axiosError.response?.data
            })
          }
        }
      }

      console.log(`Answers submitted: ${successCount} success, ${errorCount} failed`)

      // Submit the attempt
      console.log('Submitting attempt...')
      const result = await api.submitAttempt(attemptId, timeSpent)
      console.log('✓ Attempt submitted successfully:', result)

      // Navigate to results page
      alert('Nộp bài thành công!')
      router.push(`/student/results`)
    } catch (error: unknown) {
      console.error('=== ERROR SUBMITTING EXAM ===')
      console.error('Error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; statusText?: string } }
        console.error('Error details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data
        })
      }
      alert('Có lỗi khi nộp bài. Vui lòng thử lại.')
    }
  }

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && exam) {
      // Auto submit when time is up
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, exam])

  const loadExam = async (id: string) => {
    try {
      console.log('[loadExam] Starting...')
      setLoading(true)

      console.log('Loading exam with ID:', id)
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing')

      // Load exam from API with timeout
      console.log('[loadExam] Calling api.getExamById...')
      const examData = await Promise.race([
        api.getExamById(id),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
        )
      ])
      console.log('Loaded exam:', examData)

      // Transform to component format
      const transformedExam: Exam = {
        id: examData.id,
        title: examData.title,
        subject: examData.subject || 'N/A',
        duration: examData.duration || 60,
        questions: examData.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          points: q.points,
          order: q.order
        }))
      }

      setExam(transformedExam)
      setTimeRemaining(transformedExam.duration * 60) // Convert to seconds

      // Start attempt
      try {
        console.log('Starting attempt for exam:', id)
        const attempt = await api.startExam(id)
        console.log('Started attempt:', attempt)
        setAttemptId(attempt.id)
      } catch (error: any) {
        console.error('Error starting attempt:', error)
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
        
        const errorMessage = error.response?.data?.message || error.message || 'Không thể bắt đầu bài thi'
        alert(`Lỗi: ${errorMessage}`)
        
        // Navigate back to exam list
        router.push('/student/exams')
        return
      }

    } catch (error: any) {
      console.error('Error loading exam:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải bài thi. Vui lòng thử lại.'
      alert(`Lỗi: ${errorMessage}`)
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.push('/login')
      } else {
        router.push('/student/exams')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    })
  }

  const getTimeColor = () => {
    if (timeRemaining > 600) return 'text-green-600'
    if (timeRemaining > 300) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài thi...</p>
          {!examId && (
            <p className="text-red-600 mt-2 text-sm">
              Lỗi: Không tìm thấy ID bài thi trong URL
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!examId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài thi</h2>
        <p className="text-gray-600 mb-4">URL không chứa ID bài thi</p>
        <Button onClick={() => router.push('/student/exams')}>Quay lại danh sách</Button>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài thi</h2>
        <Button onClick={() => router.push('/student/exams')}>Quay lại danh sách</Button>
      </div>
    )
  }

  // Check if exam has questions
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Bài thi chưa có câu hỏi</h2>
        <p className="text-gray-600 mb-4">Vui lòng liên hệ giáo viên để biết thêm thông tin.</p>
        <Button onClick={() => router.push('/student/exams')}>Quay lại danh sách</Button>
      </div>
    )
  }

  // Get current question safely
  const question = exam.questions[currentQuestion]
  if (!question) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lỗi hiển thị câu hỏi</h2>
        <Button onClick={() => router.push('/student/exams')}>Quay lại danh sách</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <div className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white p-6 rounded-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">{exam.title}</h1>
            <p className="text-blue-100">{exam.subject}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getTimeColor()}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-blue-100">Thời gian còn lại</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Câu {currentQuestion + 1} / {exam.questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              Đã trả lời: {Object.keys(answers).length} / {exam.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / exam.questions.length) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Câu hỏi {currentQuestion + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-gray-700 leading-relaxed">
            {question.questionText}
          </p>

          <div className="space-y-3">
            {question.options.map((option) => {
              const questionId = question.id
              const isSelected = answers[questionId] === option.id

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(questionId, option.id)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                        }`}
                    >
                      {isSelected && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="flex-1 text-gray-700">{option.text}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          ← Câu trước
        </Button>

        <div className="flex space-x-2">
          {exam.questions.map((question, index) => {
            const isAnswered = answers[question.id] !== undefined
            const isCurrent = currentQuestion === index

            let buttonClass = 'w-10 h-10 rounded-full font-medium transition-all '
            if (isCurrent) {
              buttonClass += 'bg-blue-600 text-white'
            } else if (isAnswered) {
              buttonClass += 'bg-green-100 text-green-700 border border-green-300'
            } else {
              buttonClass += 'bg-gray-100 text-gray-600 border border-gray-300'
            }

            return (
              <button
                key={question.id}
                onClick={() => setCurrentQuestion(index)}
                className={buttonClass}
              >
                {index + 1}
              </button>
            )
          })}
        </div>

        {currentQuestion === exam.questions.length - 1 ? (
          <Button
            onClick={() => setShowSubmitDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Nộp bài
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
          >
            Câu tiếp →
          </Button>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nộp bài</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bài, bạn không thể thay đổi câu trả lời.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng số câu hỏi:</span>
              <span className="font-semibold">{exam.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã trả lời:</span>
              <span className="font-semibold text-green-600">{Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chưa trả lời:</span>
              <span className="font-semibold text-red-600">
                {exam.questions.length - Object.keys(answers).length}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Kiểm tra lại
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Xác nhận nộp bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
