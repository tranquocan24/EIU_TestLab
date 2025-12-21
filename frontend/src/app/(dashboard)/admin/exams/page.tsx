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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách đề thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý bài thi</h1>
        <Button variant="outline" onClick={loadExams}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Tổng số</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Đã xuất bản</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.published}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Bản nháp</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.draft}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Đã lưu trữ</div>
            <div className="text-2xl font-bold text-gray-600">
              {stats.archived}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm đề thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      {filteredExams.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách bài thi ({filteredExams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tên đề thi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Lớp
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Giáo viên
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Câu hỏi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Lượt thi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Ngày tạo
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
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
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            title="Xóa đề thi"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
