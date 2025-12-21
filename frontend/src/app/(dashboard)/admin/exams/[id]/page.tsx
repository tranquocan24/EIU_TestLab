"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
} from "lucide-react";
import api from "@/lib/api";

interface Question {
  id: string;
  questionText: string;
  type: string;
  points: number;
  order: number;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }[];
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  description?: string;
  duration: number;
  passingScore: number;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
  questions: Question[];
  _count?: {
    questions: number;
    attempts: number;
  };
}

interface Attempt {
  id: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  totalPoints: number;
  timeSpent: number | null;
  startedAt: string;
  submittedAt: string | null;
  student: {
    id: string;
    name: string;
    username: string;
  };
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }

    loadExamDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router, params.id]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const examId = params.id as string;

      // Load exam details
      const examResponse = await api.getExamById(examId);
      setExam(examResponse);

      // Load attempts for this exam
      const attemptsResponse = await api.getExamAttempts(examId);
      setAttempts(attemptsResponse);
    } catch (error) {
      console.error("Error loading exam details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GRADED":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Đã chấm điểm
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Đã nộp bài
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Đang làm bài
          </span>
        );
      default:
        return null;
    }
  };

  const getExamStatusBadge = (status: string) => {
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

  // Calculate statistics
  const stats = {
    totalAttempts: attempts.length,
    completedAttempts: attempts.filter(
      (a) => a.status === "GRADED" || a.status === "SUBMITTED"
    ).length,
    inProgress: attempts.filter((a) => a.status === "IN_PROGRESS").length,
    averageScore:
      attempts.filter((a) => a.score !== null).length > 0
        ? (
            attempts.reduce((sum, a) => sum + (a.score || 0), 0) /
            attempts.filter((a) => a.score !== null).length
          ).toFixed(1)
        : "N/A",
    highestScore:
      attempts.filter((a) => a.score !== null).length > 0
        ? Math.max(
            ...attempts.filter((a) => a.score !== null).map((a) => a.score || 0)
          )
        : "N/A",
    lowestScore:
      attempts.filter((a) => a.score !== null).length > 0
        ? Math.min(
            ...attempts.filter((a) => a.score !== null).map((a) => a.score || 0)
          )
        : "N/A",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đề thi...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Không tìm thấy đề thi
          </h3>
          <Button onClick={() => router.push("/admin/exams")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="eiu-gradient-primary text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/exams")}
              className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#112444] smooth-transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{exam.title}</h1>
              <p className="text-blue-100 mt-1">
                Chi tiết đề thi và kết quả thi
              </p>
            </div>
          </div>
          {getExamStatusBadge(exam.status)}
        </div>
      </div>

      {/* Exam Info Card */}
      <Card className="shadow-lg border-t-4 border-t-[#112444]">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-[#112444]">
            <FileText className="h-6 w-6" />
            Thông tin đề thi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1 font-medium">Môn học</p>
              <p className="text-lg font-bold text-[#112444]">{exam.subject}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1 font-medium">
                Giáo viên tạo
              </p>
              <p className="text-lg font-bold text-[#112444]">
                {exam.createdBy.name}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1 font-medium">
                Thời gian làm bài
              </p>
              <p className="text-lg font-bold text-[#112444] flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                {exam.duration} phút
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 mb-1 font-medium">
                Điểm đạt
              </p>
              <p className="text-lg font-bold text-[#112444]">
                {exam.passingScore}%
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 mb-1 font-medium">
                Số câu hỏi
              </p>
              <p className="text-lg font-bold text-[#112444]">
                {exam.questions.length} câu
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <p className="text-sm text-pink-600 mb-1 font-medium">Ngày tạo</p>
              <p className="text-lg font-bold text-[#112444] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-600" />
                {formatDate(exam.createdAt).split(",")[0]}
              </p>
            </div>
          </div>
          {exam.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-1">Mô tả</p>
              <p className="text-gray-700">{exam.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="text-xs text-blue-700 font-medium">
                Tổng lượt thi
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAttempts}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div className="text-xs text-green-700 font-medium">
                Đã hoàn thành
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedAttempts}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-xs text-yellow-700 font-medium">
                Đang làm
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div className="text-xs text-purple-700 font-medium">Điểm TB</div>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.averageScore}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <div className="text-xs text-emerald-700 font-medium">
                Cao nhất
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.highestScore}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div className="text-xs text-red-700 font-medium">Thấp nhất</div>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowestScore}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-[#112444]">
            <FileText className="h-6 w-6" />
            Danh sách câu hỏi ({exam.questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {exam.questions.map((question, index) => (
              <div
                key={question.id}
                className="border-l-4 border-[#112444] bg-gradient-to-r from-blue-50/30 to-transparent rounded-r-lg p-5 hover:shadow-md smooth-transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">
                    Câu {index + 1}: {question.questionText}
                  </h4>
                  <span className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                    {question.points} điểm
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`p-2 rounded ${
                        option.isCorrect
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {option.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span
                          className={
                            option.isCorrect
                              ? "text-green-700 font-medium"
                              : "text-gray-700"
                          }
                        >
                          {option.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attempts List */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-[#112444]">
            <Users className="h-6 w-6" />
            Danh sách bài làm ({attempts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#112444] text-white">
                    <th className="text-left py-4 px-4 font-semibold">
                      Học sinh
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Lần thi
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Trạng thái
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">Điểm</th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Thời gian làm
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Ngày nộp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt, index) => (
                    <tr
                      key={attempt.id}
                      className={`table-row-hover border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {attempt.student.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        Lần {attempt.attemptNumber}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(attempt.status)}
                      </td>
                      <td className="py-3 px-4">
                        {attempt.score !== null ? (
                          <span
                            className={`font-semibold ${
                              attempt.score >= exam.passingScore
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {attempt.score.toFixed(1)} / {attempt.totalPoints}
                          </span>
                        ) : (
                          <span className="text-gray-400">Chưa chấm</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDuration(attempt.timeSpent)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {attempt.submittedAt
                          ? formatDate(attempt.submittedAt)
                          : "Chưa nộp"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Chưa có học sinh làm bài
              </h3>
              <p className="text-gray-500">
                Chưa có lượt thi nào cho đề thi này
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
