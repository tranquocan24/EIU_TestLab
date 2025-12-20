"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface EssayAnswer {
  id: string;
  answerText: string;
  points: number;
  isCorrect: boolean;
  question: {
    id: string;
    question: string;
    type: string;
    points: number;
  };
}

interface Attempt {
  id: string;
  status: string;
  submittedAt: string;
  student: {
    id: string;
    name: string;
    username: string;
  };
  exam: {
    id: string;
    title: string;
    subject: string;
  };
  answers: EssayAnswer[];
}

export default function TeacherGradingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [gradingPoints, setGradingPoints] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadAttemptsNeedingGrading();
  }, [user]);

  const loadAttemptsNeedingGrading = async () => {
    try {
      setLoading(true);
      const data = await api.getAttemptsNeedingGrading();
      console.log("Attempts needing grading:", data);
      setAttempts(data);
    } catch (error) {
      console.error("Error loading attempts:", error);
      alert("Không thể tải danh sách bài cần chấm!");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeAllAnswers = async () => {
    if (!selectedAttempt) return;

    const essayQuestions = getEssayQuestions(selectedAttempt);

    // Validate all inputs
    const missingPoints: string[] = [];
    const invalidPoints: string[] = [];

    essayQuestions.forEach((answer, index) => {
      const points = gradingPoints[answer.question.id];

      if (points === undefined || points === null || points === "") {
        missingPoints.push(`Câu ${index + 1}`);
      } else if (points < 0 || points > answer.question.points) {
        invalidPoints.push(`Câu ${index + 1} (0-${answer.question.points})`);
      }
    });

    if (missingPoints.length > 0) {
      alert(`Vui lòng nhập điểm cho: ${missingPoints.join(", ")}`);
      return;
    }

    if (invalidPoints.length > 0) {
      alert(`Điểm không hợp lệ cho: ${invalidPoints.join(", ")}`);
      return;
    }

    try {
      // Grade all essay questions
      for (const answer of essayQuestions) {
        const points = gradingPoints[answer.question.id];
        await api.gradeEssayAnswer(
          selectedAttempt.id,
          answer.question.id,
          points
        );
      }

      alert(
        "Chấm điểm thành công! Đã chấm xong tất cả câu tự luận của bài thi này."
      );

      // Close the grading panel and return to teacher dashboard
      setSelectedAttempt(null);
      setGradingPoints({});
      await loadAttemptsNeedingGrading();
      router.push("/teacher");
    } catch (error: any) {
      console.error("Error grading answers:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể chấm điểm!";
      alert(errorMessage);
    }
  };

  const getEssayQuestions = (attempt: Attempt) => {
    return attempt.answers.filter(
      (ans) =>
        ans.question.type?.toLowerCase().includes("essay") ||
        ans.question.type?.toLowerCase().includes("text")
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("vi-VN") +
      " " +
      date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách bài cần chấm...</p>
        </div>
      </div>
    );
  }

  if (selectedAttempt) {
    const essayQuestions = getEssayQuestions(selectedAttempt);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C41E3A] to-[#8B0000] text-white p-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Chấm bài tự luận</h1>
              <p className="text-red-100">{selectedAttempt.exam.title}</p>
            </div>
            <Button
              variant="outline"
              className="bg-white text-red-600 hover:bg-red-50"
              onClick={() => setSelectedAttempt(null)}
            >
              ← Quay lại danh sách
            </Button>
          </div>
        </div>

        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin sinh viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Họ tên</p>
                <p className="font-semibold">{selectedAttempt.student.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">MSSV</p>
                <p className="font-semibold">
                  {selectedAttempt.student.username}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Môn học</p>
                <p className="font-semibold">{selectedAttempt.exam.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Thời gian nộp</p>
                <p className="font-semibold">
                  {formatDateTime(selectedAttempt.submittedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Essay Questions */}
        <div className="space-y-4">
          {essayQuestions.map((answer, index) => (
            <Card key={answer.id} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-base flex justify-between items-start">
                  <span>
                    Câu {index + 1} (Tự luận) - {answer.question.points} điểm
                  </span>
                  {answer.points > 0 && (
                    <span className="text-green-600 text-sm font-normal">
                      ✓ Đã chấm: {answer.points}/{answer.question.points} điểm
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Câu hỏi:
                  </p>
                  <p className="text-gray-800">{answer.question.question}</p>
                </div>

                {/* Student Answer */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Câu trả lời của sinh viên:
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {answer.answerText || "(Sinh viên chưa trả lời)"}
                    </p>
                  </div>
                </div>

                {/* Grading Input */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhập điểm (tối đa {answer.question.points}):
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={answer.question.points}
                    step="0.5"
                    placeholder={`0 - ${answer.question.points}`}
                    value={
                      gradingPoints[answer.question.id] ?? answer.points ?? ""
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : parseFloat(e.target.value);
                      setGradingPoints({
                        ...gradingPoints,
                        [answer.question.id]: value,
                      });
                    }}
                    className="w-full max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Tổng số câu tự luận</p>
                <p className="text-2xl font-bold">{essayQuestions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Đã chấm</p>
                <p className="text-2xl font-bold text-green-600">
                  {essayQuestions.filter((a) => a.points > 0).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chưa chấm</p>
                <p className="text-2xl font-bold text-orange-600">
                  {essayQuestions.filter((a) => a.points === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade All Button */}
        <div className="flex justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => setSelectedAttempt(null)}
            className="min-w-[200px]"
          >
            Quay lại
          </Button>
          <Button
            onClick={handleGradeAllAnswers}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white min-w-[200px] text-lg py-6"
          >
            ✓ Chấm tất cả câu tự luận
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C41E3A] to-[#8B0000] text-white p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-2">Chấm bài tự luận</h1>
        <p className="text-red-100">Danh sách bài thi cần chấm điểm</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng bài cần chấm</p>
                <p className="text-3xl font-bold text-gray-800">
                  {attempts.length}
                </p>
              </div>
              <div className="text-5xl">📝</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng câu tự luận</p>
                <p className="text-3xl font-bold text-gray-800">
                  {attempts.reduce(
                    (sum, a) => sum + getEssayQuestions(a).length,
                    0
                  )}
                </p>
              </div>
              <div className="text-5xl">✍️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Học sinh</p>
                <p className="text-3xl font-bold text-gray-800">
                  {new Set(attempts.map((a) => a.student.id)).size}
                </p>
              </div>
              <div className="text-5xl">👥</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempts List */}
      {attempts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Không có bài thi nào cần chấm
            </h3>
            <p className="text-gray-600">
              Tất cả các bài thi tự luận đã được chấm điểm hoặc chưa có bài nộp
              mới.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const essayQuestions = getEssayQuestions(attempt);
            const gradedCount = essayQuestions.filter(
              (a) => a.points > 0
            ).length;
            const totalEssays = essayQuestions.length;

            return (
              <Card
                key={attempt.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {attempt.exam.title}
                        </h3>
                        <span className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {attempt.exam.subject}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-600">Học sinh</p>
                          <p className="font-medium">{attempt.student.name}</p>
                          <p className="text-xs text-gray-500">
                            {attempt.student.username}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Thời gian nộp</p>
                          <p className="font-medium">
                            {formatDateTime(attempt.submittedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Câu tự luận</p>
                          <p className="font-medium">{totalEssays} câu</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Tiến độ chấm</p>
                          <p className="font-medium">
                            {gradedCount}/{totalEssays}
                            {gradedCount === totalEssays && totalEssays > 0 && (
                              <span className="text-green-600 ml-2">✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setSelectedAttempt(attempt)}
                      className="bg-red-600 hover:bg-red-700 text-white ml-4"
                    >
                      Chấm điểm
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
