"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Eye,
  Trash2,
  Archive,
  RefreshCw,
  BookOpen,
  CheckCircle,
  Edit,
  FolderArchive,
} from "lucide-react";
import api from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  subject: string;
  allowedCourses?: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  createdAt: string;
  createdBy: {
    name: string;
  };
  _count?: {
    questions: number;
    attempts: number;
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
}

export default function AdminExamsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }

    loadExams();
    loadCourses();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    filterExams();
  }, [exams, searchQuery, statusFilter, courseFilter]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await api.getExams();
      setExams(data);
    } catch (error) {
      console.error("Error loading exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const filterExams = () => {
    let filtered = [...exams];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.subject.toLowerCase().includes(query) ||
          (e.allowedCourses &&
            e.allowedCourses.toLowerCase().includes(query)) ||
          e.createdBy.name.toLowerCase().includes(query)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (e) => e.status === statusFilter.toUpperCase()
      );
    }

    if (courseFilter && courseFilter !== "all") {
      filtered = filtered.filter(
        (e) => e.allowedCourses && e.allowedCourses.includes(courseFilter)
      );
    }

    setFilteredExams(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            Đã xuất bản
          </span>
        );
      case "DRAFT":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            Bản nháp
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            Đã lưu trữ
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này?")) {
      return;
    }

    try {
      const result = await api.deleteExam(examId);
      console.log("Delete result:", result);
      alert(result.message || "Xóa đề thi thành công!");
      await loadExams();
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra. Vui lòng thử lại!";
      alert(errorMessage);
    }
  };

  const handleViewExam = (examId: string) => {
    router.push(`/admin/exams/${examId}`);
  };

  const handleArchiveExam = async (examId: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn lưu trữ đề thi này? Học sinh sẽ không thể làm bài nữa, chỉ có thể xem kết quả."
      )
    ) {
      return;
    }

    try {
      const result = await api.archiveExam(examId);
      alert(result.message || "Lưu trữ đề thi thành công!");
      await loadExams();
    } catch (error: any) {
      console.error("Error archiving exam:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra. Vui lòng thử lại!";
      alert(errorMessage);
    }
  };

  const stats = {
    total: exams.length,
    published: exams.filter((e) => e.status === "PUBLISHED").length,
    draft: exams.filter((e) => e.status === "DRAFT").length,
    archived: exams.filter((e) => e.status === "ARCHIVED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách đề thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="eiu-gradient-primary text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Quản lý bài thi</h1>
          </div>
          <p className="text-blue-100 ml-11">
            Quản lý và theo dõi các đề thi trong hệ thống
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadExams}
          className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#112444] smooth-transition"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-gray-600 font-medium">Tổng số</div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-green-700 font-medium">
                Đã xuất bản
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {stats.published}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-yellow-700 font-medium">
                Bản nháp
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.draft}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-gray-50 to-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-400 rounded-lg">
                <FolderArchive className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-gray-700 font-medium">
                Đã lưu trữ
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-600">
              {stats.archived}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm đề thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus:ring-2 focus:ring-[#112444]"
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="focus:ring-2 focus:ring-[#112444]">
                <SelectValue placeholder="Tất cả lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.code}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="focus:ring-2 focus:ring-[#112444]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="archived">Đã lưu trữ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      {filteredExams.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <CardTitle className="text-[#112444]">
              Danh sách bài thi ({filteredExams.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#112444] text-white">
                    <th className="text-left py-4 px-4 font-semibold">
                      Tên đề thi
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">Lớp</th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Giáo viên
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Trạng thái
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Câu hỏi
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Lượt thi
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Ngày tạo
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((exam, index) => (
                    <tr
                      key={exam.id}
                      className={`table-row-hover border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {exam.title}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {exam.allowedCourses || "Tất cả"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {exam.createdBy.name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(exam.status)}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {exam._count?.questions || 0}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {exam._count?.attempts || 0}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(exam.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewExam(exam.id)}
                            title="Xem chi tiết"
                            className="hover:bg-[#112444] hover:text-white hover:border-[#112444] smooth-transition"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveExam(exam.id)}
                            disabled={exam.status === "ARCHIVED"}
                            title={
                              exam.status === "ARCHIVED"
                                ? "Đã lưu trữ"
                                : "Lưu trữ đề thi"
                            }
                            className="hover:bg-gray-600 hover:text-white hover:border-gray-600 smooth-transition disabled:opacity-50"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            title="Xóa đề thi"
                            className="hover:bg-red-600 hover:text-white hover:border-red-600 smooth-transition"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 hover:text-white" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Không tìm thấy đề thi
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== "all" || courseFilter !== "all"
                  ? "Không tìm thấy đề thi phù hợp với bộ lọc"
                  : "Chưa có đề thi nào trong hệ thống"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
