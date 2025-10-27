'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Users, CheckCircle, FileEdit, PlusCircle, RefreshCw, Search, Filter, Edit, Copy, Trash2, Eye, Archive } from 'lucide-react'

interface Exam {
  id: string
  title: string
  subject: string
  status: 'published' | 'draft' | 'archived'
  questionCount: number
  duration: number
  submissions: number
  createdAt: string
}

export default function ManageExamsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created-desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== 'teacher') {
      router.push('/login')
      return
    }

    loadExams()
  }, [isAuthenticated, user, router])

  useEffect(() => {
    filterAndSortExams()
  }, [exams, searchQuery, subjectFilter, statusFilter, sortBy])

  const loadExams = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const mockExams: Exam[] = [
        {
          id: '1',
          title: 'Kiểm tra giữa kỳ - Lập trình Web',
          subject: 'Lập trình Web',
          status: 'published',
          questionCount: 30,
          duration: 60,
          submissions: 45,
          createdAt: '2025-01-15'
        },
        {
          id: '2',
          title: 'Bài tập JavaScript cơ bản',
          subject: 'Lập trình Web',
          status: 'published',
          questionCount: 20,
          duration: 45,
          submissions: 38,
          createdAt: '2025-01-10'
        },
        {
          id: '3',
          title: 'Thiết kế cơ sở dữ liệu',
          subject: 'Cơ sở dữ liệu',
          status: 'draft',
          questionCount: 25,
          duration: 90,
          submissions: 0,
          createdAt: '2025-01-20'
        },
        {
          id: '4',
          title: 'SQL nâng cao',
          subject: 'Cơ sở dữ liệu',
          status: 'published',
          questionCount: 35,
          duration: 75,
          submissions: 52,
          createdAt: '2025-01-05'
        },
        {
          id: '5',
          title: 'Mạng máy tính - Tầng giao vận',
          subject: 'Mạng máy tính',
          status: 'archived',
          questionCount: 40,
          duration: 120,
          submissions: 60,
          createdAt: '2024-12-20'
        }
      ]
      
      setExams(mockExams)
    } catch (error) {
      console.error('Error loading exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortExams = () => {
    let filtered = [...exams]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(query) ||
        exam.subject.toLowerCase().includes(query)
      )
    }

    // Apply subject filter
    if (subjectFilter && subjectFilter !== 'all') {
      filtered = filtered.filter(exam => exam.subject === subjectFilter)
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'submissions-desc':
          return b.submissions - a.submissions
        default:
          return 0
      }
    })

    setFilteredExams(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Đã xuất bản</span>
      case 'draft':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Bản nháp</span>
      case 'archived':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Đã lưu trữ</span>
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const stats = {
    total: exams.length,
    published: exams.filter(e => e.status === 'published').length,
    draft: exams.filter(e => e.status === 'draft').length,
    submissions: exams.reduce((sum, e) => sum + e.submissions, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách đề thi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý đề thi</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadExams}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => router.push('/teacher/create')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Tạo đề thi mới
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Tổng số đề thi</div>
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-500">Tất cả đề thi đã tạo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Đã xuất bản</div>
                <div className="text-2xl font-bold text-gray-800">{stats.published}</div>
                <div className="text-xs text-gray-500">Đang hoạt động</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileEdit className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Bản nháp</div>
                <div className="text-2xl font-bold text-gray-800">{stats.draft}</div>
                <div className="text-xs text-gray-500">Chờ hoàn thiện</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Lượt thi</div>
                <div className="text-2xl font-bold text-gray-800">{stats.submissions}</div>
                <div className="text-xs text-gray-500">Tổng lượt thi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm đề thi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả môn học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn học</SelectItem>
                  <SelectItem value="Lập trình Web">Lập trình Web</SelectItem>
                  <SelectItem value="Cơ sở dữ liệu">Cơ sở dữ liệu</SelectItem>
                  <SelectItem value="Mạng máy tính">Mạng máy tính</SelectItem>
                  <SelectItem value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="published">Đã xuất bản</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="archived">Đã lưu trữ</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created-desc">Mới nhất</SelectItem>
                  <SelectItem value="created-asc">Cũ nhất</SelectItem>
                  <SelectItem value="title-asc">Tên A-Z</SelectItem>
                  <SelectItem value="title-desc">Tên Z-A</SelectItem>
                  <SelectItem value="submissions-desc">Nhiều lượt thi nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc nâng cao
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exams Grid */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                    {exam.title}
                  </CardTitle>
                  {getStatusBadge(exam.status)}
                </div>
                <p className="text-purple-600 font-medium text-sm">{exam.subject}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số câu hỏi:</span>
                    <span className="font-semibold text-gray-800">{exam.questionCount} câu</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thời lượng:</span>
                    <span className="font-semibold text-gray-800">{exam.duration} phút</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lượt thi:</span>
                    <span className="font-semibold text-purple-600">{exam.submissions} lượt</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="font-semibold text-gray-800">{formatDate(exam.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Xem
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có đề thi nào</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || subjectFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Không tìm thấy đề thi phù hợp với bộ lọc' 
                  : 'Bắt đầu tạo đề thi đầu tiên của bạn để quản lý bài kiểm tra'}
              </p>
              <Button onClick={() => router.push('/teacher/create')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Tạo đề thi mới
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
