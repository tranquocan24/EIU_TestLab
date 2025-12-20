"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Award,
  FileText,
} from "lucide-react";
import api from "@/lib/api";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  options: Option[];
  points: number;
  order: number;
}

interface Answer {
  id: string;
  questionId: string;
  selectedOption: string | null;
  answerText: string | null;
  isCorrect: boolean;
  points: number;
  question: Question & {
    type?: string;
  };
}

interface AttemptDetail {
  id: string;
  score: number | null;
  timeSpent: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  exam: {
    id: string;
    title: string;
    subject: string;
    duration: number;
  };
  answers: Answer[];
}

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "student") {
      router.push("/login");
      return;
    }

    if (attemptId) {
      loadAttemptDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router, attemptId]);

  const loadAttemptDetail = async () => {
    try {
      setLoading(true);
      console.log("Loading attempt detail:", attemptId);

      const data = await api.getAttemptDetail(attemptId);
      console.log("Attempt detail:", data);

      // Transform data to match interface
      const transformedAttempt: AttemptDetail = {
        id: data.id,
        score:
          data.score !== null && data.score !== undefined ? data.score : null,
        timeSpent: data.timeSpent || 0,
        status: data.status,
        startedAt: data.startedAt,
        submittedAt: data.submittedAt,
        exam: {
          id: data.exam.id,
          title: data.exam.title,
          subject: data.exam.subject || "N/A",
          duration: data.exam.duration || 60,
        },
        answers: data.answers.map(
          (answer: {
            id: string;
            questionId: string;
            selectedOption: string | null;
            answerText?: string | null;
            isCorrect: boolean;
            points: number;
            question: {
              id: string;
              questionText?: string;
              question?: string;
              type?: string;
              points: number;
              order: number;
              options?: {
                id: string;
                text?: string;
                option?: string;
                isCorrect: boolean;
              }[];
            };
          }) => ({
            id: answer.id,
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            answerText: answer.answerText || null,
            isCorrect: answer.isCorrect,
            points: answer.points,
            question: {
              id: answer.question.id,
              questionText:
                answer.question.questionText || answer.question.question || "",
              type: answer.question.type,
              options: (answer.question.options || []).map(
                (opt: {
                  id: string;
                  text?: string;
                  option?: string;
                  isCorrect: boolean;
                }) => ({
                  id: opt.id,
                  text: opt.text || opt.option || "",
                  isCorrect: opt.isCorrect,
                })
              ),
              points: answer.question.points,
              order: answer.question.order,
            },
          })
        ),
      };

      setAttempt(transformedAttempt);
    } catch (error) {
      console.error("Failed to load attempt detail:", error);
      alert("Không thể tải chi tiết bài thi");
      router.push("/student/results");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} phút`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: "Xuất sắc", color: "bg-green-500" };
    if (score >= 80) return { text: "Giỏi", color: "bg-blue-500" };
    if (score >= 70) return { text: "Khá", color: "bg-yellow-500" };
    if (score >= 60) return { text: "Trung bình", color: "bg-orange-500" };
    return { text: "Yếu", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mb-4"></div>
        <p className="text-gray-600">Đang tải chi tiết...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Không tìm thấy kết quả
        </h3>
        <Button onClick={() => router.push("/student/results")}>
          Quay lại danh sách
        </Button>
      </Card>
    );
  }

  const isPending = attempt.score === null || attempt.score === undefined;
  const badge = isPending
    ? { text: "Đang chấm", color: "bg-purple-500" }
    : getScoreBadge(attempt.score);
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const totalCount = attempt.answers.length;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/student/results")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">Chi tiết kết quả</h2>
          <p className="text-gray-600">{attempt.exam.title}</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl">{attempt.exam.title}</span>
            <Badge className={`${badge.color} text-white px-4 py-2 text-sm`}>
              {badge.text}
            </Badge>
          </CardTitle>
          <p className="text-blue-600 font-medium">{attempt.exam.subject}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              {isPending ? (
                <>
                  <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">
                    Đang chấm
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Chờ giáo viên
                  </div>
                </>
              ) : (
                <>
                  <Award
                    className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(
                      attempt.score!
                    )}`}
                  />
                  <div
                    className={`text-3xl font-bold ${getScoreColor(
                      attempt.score!
                    )}`}
                  >
                    {attempt.score!.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Điểm số</div>
                </>
              )}
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold text-gray-800">
                {correctCount}/{totalCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Câu đúng</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold text-gray-800">
                {formatDuration(attempt.timeSpent)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Thời gian làm bài
              </div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold text-gray-800">
                {totalCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Tổng số câu</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Bắt đầu:</span>
              <span className="ml-2 font-medium">
                {formatDate(attempt.startedAt)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Hoàn thành:</span>
              <span className="ml-2 font-medium">
                {formatDate(attempt.submittedAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Đáp án chi tiết
        </h3>

        {[...attempt.answers]
          .sort((a, b) => a.question.order - b.question.order)
          .map((answer, index) => {
            const isEssay =
              answer.question.type?.toLowerCase().includes("essay") ||
              answer.question.type?.toLowerCase().includes("text");
            const isGraded = answer.points > 0 || answer.isCorrect;

            return (
              <Card
                key={answer.id}
                className={`border-2 ${
                  isEssay
                    ? isGraded
                      ? "border-blue-200 bg-blue-50/30"
                      : "border-purple-200 bg-purple-50/30"
                    : answer.isCorrect
                    ? "border-green-200 bg-green-50/30"
                    : "border-red-200 bg-red-50/30"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-sm">
                          Câu {index + 1}
                        </Badge>
                        {isEssay ? (
                          <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
                            Tự luận
                          </Badge>
                        ) : (
                          <Badge
                            className={`${
                              answer.isCorrect
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                            } text-white`}
                          >
                            {answer.isCorrect ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Đúng
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Sai
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {answer.question.questionText}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Điểm</div>
                      {isEssay && !isGraded ? (
                        <div className="text-lg font-bold text-purple-600">
                          Chờ chấm
                        </div>
                      ) : (
                        <div
                          className={`text-2xl font-bold ${
                            isEssay
                              ? "text-blue-600"
                              : answer.isCorrect
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {answer.points}/{answer.question.points}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEssay ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg border-2 border-purple-200 bg-white">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Câu trả lời của bạn:
                        </div>
                        <div className="text-gray-800 whitespace-pre-wrap">
                          {answer.answerText || (
                            <span className="text-gray-400 italic">
                              Chưa có câu trả lời
                            </span>
                          )}
                        </div>
                      </div>
                      {!isGraded && (
                        <div className="p-3 rounded-lg bg-purple-100 border border-purple-300 text-sm text-purple-800">
                          <span className="font-medium">ℹ️ Lưu ý:</span> Câu tự
                          luận này đang chờ giáo viên chấm điểm
                        </div>
                      )}
                    </div>
                  ) : (
                    answer.question.options.map((option) => {
                      const isSelected = option.id === answer.selectedOption;
                      const isCorrect = option.isCorrect;

                      let optionClass = "border-gray-200 bg-white";
                      if (isCorrect) {
                        optionClass = "border-green-500 bg-green-50";
                      } else if (isSelected && !isCorrect) {
                        optionClass = "border-red-500 bg-red-50";
                      }

                      let icon: React.ReactNode;
                      if (isCorrect) {
                        icon = (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        );
                      } else if (isSelected) {
                        icon = (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        );
                      } else {
                        icon = (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        );
                      }

                      return (
                        <div
                          key={option.id}
                          className={`p-4 rounded-lg border-2 ${optionClass}`}
                        >
                          <div className="flex items-center gap-3">
                            {icon}
                            <div className="flex-1">
                              <p className="text-gray-800">{option.text}</p>
                              {isCorrect && (
                                <p className="text-sm text-green-600 font-medium mt-1">
                                  ✓ Đáp án đúng
                                </p>
                              )}
                              {isSelected && !isCorrect && (
                                <p className="text-sm text-red-600 font-medium mt-1">
                                  ✗ Bạn đã chọn đáp án này
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-6">
        <Button
          variant="outline"
          onClick={() => router.push("/student/results")}
          className="min-w-[200px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>
        <Button
          onClick={() => router.push("/student/exams")}
          className="min-w-[200px] bg-gradient-to-r from-[#112444] to-[#1a365d]"
        >
          Làm bài thi khác
        </Button>
      </div>
    </div>
  );
}
