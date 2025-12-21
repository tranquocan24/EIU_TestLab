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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/exams")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">{exam.title}</h1>
        </div>
        {getExamStatusBadge(exam.status)}
      </div>

      {/* Exam Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông tin đề thi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Môn học</p>
              <p className="text-lg font-semibold text-gray-800">
                {exam.subject}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Giáo viên tạo</p>
              <p className="text-lg font-semibold text-gray-800">
                {exam.createdBy.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Thời gian làm bài</p>
              <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {exam.duration} phút
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Điểm đạt</p>
              <p className="text-lg font-semibold text-gray-800">
                {exam.passingScore}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Số câu hỏi</p>
              <p className="text-lg font-semibold text-gray-800">
                {exam.questions.length} câu
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
              <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(exam.createdAt)}
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
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Tổng lượt thi</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAttempts}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Đã hoàn thành</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedAttempts}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Đang làm</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Điểm TB</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.averageScore}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Cao nhất</div>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.highestScore}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Thấp nhất</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowestScore}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Danh sách câu hỏi ({exam.questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exam.questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách bài làm ({attempts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Học sinh
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Lần thi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Điểm
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Thời gian làm
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Ngày nộp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr
                      key={attempt.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
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
