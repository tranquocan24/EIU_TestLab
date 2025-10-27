'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer?: number
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

  const [exam, setExam] = useState<Exam | null>(null)
  const [answers, setAnswers] = useState<{ [key: string]: number }>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (examId) {
      loadExam(examId)
    }
  }, [examId])

  const handleSubmit = () => {
    // Calculate score
    const totalQuestions = exam?.questions.length || 0
    const answeredQuestions = Object.keys(answers).length
    const score = (answeredQuestions / totalQuestions) * 100

    console.log('Submitting exam with answers:', answers)
    console.log('Score:', score)

    // Navigate to results page
    router.push(`/student/results?examId=${examId}&score=${score}`)
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockExam: Exam = {
        id,
        title: 'Kiểm tra giữa kỳ - Lập trình Web',
        subject: 'Lập trình Web',
        duration: 90,
        questions: [
          {
            id: '1',
            question: 'HTML là viết tắt của gì?',
            options: [
              'Hyper Text Markup Language',
              'High Tech Modern Language',
              'Home Tool Markup Language',
              'Hyperlinks and Text Markup Language'
            ]
          },
          {
            id: '2',
            question: 'CSS được sử dụng để làm gì?',
            options: [
              'Tạo cấu trúc trang web',
              'Tạo kiểu dáng cho trang web',
              'Lập trình logic cho trang web',
              'Quản lý cơ sở dữ liệu'
            ]
          },
          {
            id: '3',
            question: 'JavaScript là ngôn ngữ lập trình gì?',
            options: [
              'Ngôn ngữ biên dịch',
              'Ngôn ngữ thông dịch',
              'Ngôn ngữ đánh dấu',
              'Ngôn ngữ truy vấn'
            ]
          },
          {
            id: '4',
            question: 'Thẻ nào dùng để tạo liên kết trong HTML?',
            options: [
              '<link>',
              '<a>',
              '<href>',
              '<url>'
            ]
          },
          {
            id: '5',
            question: 'React là gì?',
            options: [
              'Một framework CSS',
              'Một thư viện JavaScript để xây dựng UI',
              'Một ngôn ngữ lập trình',
              'Một hệ quản trị cơ sở dữ liệu'
            ]
          }
        ]
      }

      setExam(mockExam)
      setTimeRemaining(mockExam.duration * 60) // Convert to seconds
    } catch (error) {
      console.error('Error loading exam:', error)
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

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex
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
        </div>
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
            {exam.questions[currentQuestion].question}
          </p>

          <div className="space-y-3">
            {exam.questions[currentQuestion].options.map((option, index) => {
              const questionId = exam.questions[currentQuestion].id
              const isSelected = answers[questionId] === index
              
              return (
                <button
                  key={`${questionId}-option-${index}`}
                  onClick={() => handleAnswerSelect(questionId, index)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="flex-1 text-gray-700">{option}</span>
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
