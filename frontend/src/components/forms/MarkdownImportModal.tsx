'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileUp, FileText, Eye, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Question {
  questionOrder: number
  questionType: 'multiple-choice' | 'multiple-select' | 'text'
  questionText: string
  points: number
  options?: Array<{ optionOrder: number; optionText: string }>
  correctAnswer: any
  explanation?: string
}

interface ParsedExam {
  title: string
  subject: string
  duration: number
  description?: string
  questions: Question[]
}

interface MarkdownImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (examData: ParsedExam) => void
}

export function MarkdownImportModal({ open, onOpenChange, onImport }: MarkdownImportModalProps) {
  const [markdownContent, setMarkdownContent] = useState('')
  const [parsedExam, setParsedExam] = useState<ParsedExam | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.md')) {
      setError('Vui lòng chọn file có định dạng .md')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setMarkdownContent(content)
      setError('')
      setSuccess('File đã được tải lên thành công!')
      setTimeout(() => setSuccess(''), 3000)
    }
    reader.onerror = () => {
      setError('Không thể đọc file. Vui lòng thử lại.')
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handlePreview = async () => {
    if (!markdownContent.trim()) {
      setError('Vui lòng nhập nội dung markdown hoặc tải file lên')
      return
    }

    setIsLoading(true)
    setError('')
    setParsedExam(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/exams/import-markdown`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ markdownContent }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setParsedExam(data)
      setSuccess('Preview đã được tạo thành công!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Preview error:', err)
      setError(err.message || 'Không thể parse markdown. Vui lòng kiểm tra định dạng.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (!parsedExam) {
      setError('Vui lòng preview trước khi import')
      return
    }

    onImport(parsedExam)
    handleClose()
  }

  const handleClose = () => {
    setMarkdownContent('')
    setParsedExam(null)
    setError('')
    setSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'Trắc nghiệm đơn'
      case 'multiple-select':
        return 'Trắc nghiệm nhiều lựa chọn'
      case 'text':
        return 'Tự luận'
      default:
        return type
    }
  }

  const getQuestionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'bg-blue-100 text-blue-800'
      case 'multiple-select':
        return 'bg-purple-100 text-purple-800'
      case 'text':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#112444]">
            Import Đề Thi từ Markdown
          </DialogTitle>
          <DialogDescription>
            Tải file .md hoặc paste nội dung markdown để import đề thi.{' '}
            <a
              href="/markdown_guide.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#112444] hover:underline font-medium"
            >
              Xem hướng dẫn định dạng
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800 ml-2">{success}</p>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800 ml-2">{error}</p>
            </Alert>
          )}

          {!parsedExam ? (
            /* Input Section */
            <div className="space-y-4 flex-1 overflow-auto">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                  Tải file Markdown
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Chọn file .md
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-500">
                <Separator className="flex-1" />
                <span className="text-sm">hoặc</span>
                <Separator className="flex-1" />
              </div>

              {/* Text Input */}
              <div className="space-y-2 flex-1 flex flex-col">
                <Label htmlFor="markdown-content" className="text-sm font-medium text-gray-700">
                  Paste nội dung Markdown
                </Label>
                <Textarea
                  id="markdown-content"
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="Paste nội dung markdown vào đây...&#10;&#10;Ví dụ:&#10;# Đề thi Lập trình Web&#10;**Môn học:** Lập trình Web&#10;**Thời gian:** 90 phút&#10;..."
                  className="flex-1 min-h-[300px] font-mono text-sm"
                />
              </div>

              {/* Preview Button */}
              <Button
                type="button"
                onClick={handlePreview}
                disabled={!markdownContent.trim() || isLoading}
                className="w-full bg-[#112444] hover:bg-[#1a3666] text-white"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Preview Section */
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Exam Header */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[#112444] mb-1">
                      {parsedExam.title}
                    </h3>
                    {parsedExam.description && (
                      <p className="text-sm text-gray-600">{parsedExam.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Môn học:</span>
                      <span className="text-gray-900">{parsedExam.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Thời gian:</span>
                      <span className="text-gray-900">{parsedExam.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Số câu hỏi:</span>
                      <span className="text-gray-900">{parsedExam.questions.length}</span>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-[#112444]">Danh sách câu hỏi:</h4>
                  {parsedExam.questions.map((question, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-[#112444]">
                              Câu {question.questionOrder}:
                            </span>
                            <Badge
                              className={getQuestionTypeBadgeColor(question.questionType)}
                            >
                              {getQuestionTypeLabel(question.questionType)}
                            </Badge>
                            <Badge variant="outline" className="ml-auto">
                              {question.points} điểm
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-800 mb-3">{question.questionText}</p>

                          {/* Options for multiple choice/select */}
                          {question.options && question.options.length > 0 && (
                            <div className="space-y-1 ml-4">
                              {question.options.map((option, optIndex) => {
                                const isCorrect =
                                  question.questionType === 'multiple-choice'
                                    ? question.correctAnswer === option.optionText
                                    : Array.isArray(question.correctAnswer) &&
                                      question.correctAnswer.includes(option.optionText)

                                return (
                                  <div
                                    key={optIndex}
                                    className={`text-sm px-2 py-1 rounded ${
                                      isCorrect
                                        ? 'bg-green-50 text-green-800 font-medium'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}. {option.optionText}
                                    {isCorrect && (
                                      <span className="ml-2 text-green-600">✓</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Explanation */}
                          {question.explanation && (
                            <div className="mt-2 text-xs text-gray-600 italic bg-blue-50 px-2 py-1 rounded">
                              <strong>Giải thích:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          {!parsedExam ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setParsedExam(null)
                  setError('')
                }}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                className="w-full sm:w-auto bg-[#112444] hover:bg-[#1a3666] text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
