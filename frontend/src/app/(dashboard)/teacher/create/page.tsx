'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PlusCircle, Trash2, Save, Send, FileText, Upload } from 'lucide-react'
import api from '@/lib/api'

interface Question {
    id: string
    type: 'multiple-choice' | 'essay'
    content: string
    options?: string[]
    correctAnswer?: number | string
    points: number
}

export default function CreateExamPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [loading, setLoading] = useState(false)

    // Basic Info
    const [title, setTitle] = useState('')
    const [selectedCourse, setSelectedCourse] = useState('')
    const [description, setDescription] = useState('')
    const [duration, setDuration] = useState('60')

    // Teacher's assigned courses
    const [teacherCourses, setTeacherCourses] = useState<string[]>([])

    // Advanced Settings
    const [shuffleQuestions, setShuffleQuestions] = useState(false)
    const [shuffleAnswers, setShuffleAnswers] = useState(false)
    const [showResults, setShowResults] = useState(true)
    const [allowReview, setAllowReview] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Questions
    const [questions, setQuestions] = useState<Question[]>([])

    useEffect(() => {
        if (!isAuthenticated || user?.role.toLowerCase() !== 'teacher') {
            router.push('/login')
            return
        }

        // Parse teacher's courses from user.courses string
        if (user?.courses) {
            const coursesArray = user.courses.split(',').map(c => c.trim()).filter(c => c)
            setTeacherCourses(coursesArray)

            // Auto-select first course if available
            if (coursesArray.length > 0 && !selectedCourse) {
                setSelectedCourse(coursesArray[0])
            }
        }
    }, [isAuthenticated, user, router, selectedCourse])

    const addQuestion = (type: 'multiple-choice' | 'essay') => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            type,
            content: '',
            points: 1,
            ...(type === 'multiple-choice' && {
                options: ['', '', '', ''],
                correctAnswer: 0
            })
        }
        setQuestions([...questions, newQuestion])
    }

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const updateQuestion = (id: string, field: string, value: any) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ))
    }

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options) {
                const newOptions = [...q.options]
                newOptions[optionIndex] = value
                return { ...q, options: newOptions }
            }
            return q
        }))
    }

    const handleSubmit = async (status: 'draft' | 'published') => {
        try {
            console.log('handleSubmit called with status:', status)
            setLoading(true)

            // Validate required fields
            if (!title || !selectedCourse || !duration) {
                console.log('Validation failed: Missing required fields', { title, selectedCourse, duration })
                alert('Vui lòng điền đầy đủ thông tin cơ bản (Tên đề thi, Course, Thời gian)!')
                setLoading(false)
                return
            }

            if (questions.length === 0) {
                console.log('Validation failed: No questions')
                alert('Vui lòng thêm ít nhất 1 câu hỏi!')
                setLoading(false)
                return
            }

            // Map status to backend enum (DRAFT, PUBLISHED, ARCHIVED)
            const examStatus = status === 'draft' ? 'DRAFT' : 'PUBLISHED'

            const examData: any = {
                title,
                subject: selectedCourse, // Use selected course as subject
                description: description || undefined,
                duration: Number.parseInt(duration),
                status: examStatus,
                passingScore: 60, // Default passing score
                allowedCourses: selectedCourse, // Backend expects comma-separated string
                startTime: startDate ? new Date(startDate).toISOString() : undefined,
                endTime: endDate ? new Date(endDate).toISOString() : undefined,
                questions: questions.map((q, index) => ({
                    questionText: q.content,
                    questionType: q.type === 'multiple-choice' ? 'MULTIPLE_CHOICE' : 'ESSAY',
                    points: q.points || 10,
                    order: index + 1,
                    options: q.type === 'multiple-choice' && q.options
                        ? q.options.map((optText, optIndex) => ({
                            text: optText,
                            isCorrect: q.correctAnswer === optIndex,
                        }))
                        : [],
                })),
            }

            console.log('Creating exam with data:', examData)

            // Call API to create exam
            const response = await api.createExam(examData)

            console.log('API response:', response)

            // Redirect immediately after successful creation
            const successMessage = status === 'draft' ? 'Lưu bản nháp thành công!' : 'Xuất bản đề thi thành công!'

            // Store success message in sessionStorage to show on next page
            sessionStorage.setItem('examCreated', successMessage)

            // Navigate to exams page
            router.push('/teacher/exams')
        } catch (error: any) {
            console.error('Error creating exam:', error)
            console.error('Error details:', error.response?.data)
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!'
            alert(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-fadeInUp max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 rounded-2xl text-center shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Tạo đề thi mới</h1>
                <p className="text-purple-100">Tạo đề thi trực tuyến với các câu hỏi trắc nghiệm và tự luận</p>
            </div>

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Thông tin cơ bản
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Tên đề thi <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            placeholder="Nhập tên đề thi"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="course">Course được phân công <span className="text-red-500">*</span></Label>
                            {teacherCourses.length > 0 ? (
                                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teacherCourses.map((course) => (
                                            <SelectItem key={course} value={course}>
                                                {course}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                                    ⚠️ Bạn chưa được phân công course nào. Vui lòng liên hệ Admin.
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="duration">Thời lượng (phút) <span className="text-red-500">*</span></Label>
                            <Input
                                id="duration"
                                type="number"
                                min="1"
                                placeholder="60"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            placeholder="Mô tả ngắn về đề thi"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Cài đặt nâng cao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Ngày bắt đầu</Label>
                            <Input
                                id="startDate"
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="endDate">Ngày kết thúc</Label>
                            <Input
                                id="endDate"
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={shuffleQuestions}
                                onChange={(e) => setShuffleQuestions(e.target.checked)}
                            />
                            <span>Xáo trộn câu hỏi</span>
                        </label>

                        <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={shuffleAnswers}
                                onChange={(e) => setShuffleAnswers(e.target.checked)}
                            />
                            <span>Xáo trộn đáp án</span>
                        </label>

                        <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={showResults}
                                onChange={(e) => setShowResults(e.target.checked)}
                            />
                            <span>Hiển thị kết quả ngay sau khi nộp bài</span>
                        </label>

                        <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={allowReview}
                                onChange={(e) => setAllowReview(e.target.checked)}
                            />
                            <span>Cho phép xem lại bài thi</span>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Questions */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Câu hỏi ({questions.length})</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => addQuestion('multiple-choice')}>
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Trắc nghiệm
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addQuestion('essay')}>
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Tự luận
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {questions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                            <div className="text-6xl mb-4">❓</div>
                            <p className="text-gray-500 mb-4">Chưa có câu hỏi nào</p>
                            <div className="flex gap-2 justify-center">
                                <Button variant="outline" onClick={() => addQuestion('multiple-choice')}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Thêm câu trắc nghiệm
                                </Button>
                                <Button variant="outline" onClick={() => addQuestion('essay')}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Thêm câu tự luận
                                </Button>
                            </div>
                        </div>
                    ) : (
                        questions.map((question, index) => (
                            <Card key={question.id} className="border-l-4 border-l-purple-500">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-purple-600">Câu {index + 1}</span>
                                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                {question.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeQuestion(question.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>

                                    <div>
                                        <Label>Nội dung câu hỏi</Label>
                                        <Textarea
                                            placeholder="Nhập nội dung câu hỏi"
                                            value={question.content}
                                            onChange={(e) => updateQuestion(question.id, 'content', e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    {question.type === 'multiple-choice' && question.options && (
                                        <div>
                                            <Label>Đáp án</Label>
                                            <div className="space-y-2 mt-2">
                                                {question.options.map((option, optionIndex) => (
                                                    <div key={optionIndex} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`correct-${question.id}`}
                                                            checked={question.correctAnswer === optionIndex}
                                                            onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                                                        />
                                                        <Input
                                                            placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`}
                                                            value={option}
                                                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-32">
                                        <Label>Điểm</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={question.points}
                                            onChange={(e) => updateQuestion(question.id, 'points', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pb-6">
                <Button variant="outline" onClick={() => router.push('/teacher/exams')}>
                    Hủy
                </Button>
                <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu bản nháp
                </Button>
                <Button onClick={() => handleSubmit('published')} disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    Xuất bản
                </Button>
            </div>
        </div>
    )
}
