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
  User,
  Video,
} from "lucide-react";
import api from "@/lib/api";
import ProctoringViewer from "@/components/proctoring/ProctoringViewer";

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
  student: {
    id: string;
    username: string;
    name: string;
    courses: string;
  };
  exam: {
    id: string;
    title: string;
    subject: string;
    duration: number;
  };
  answers: Answer[];
}

export default function TeacherResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProctoringVideo, setShowProctoringVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "teacher") {
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
        student: {
          id: data.student?.id || "",
          username: data.student?.username || "N/A",
          name: data.student?.name || "Unknown Student",
          courses: data.student?.courses || "N/A",
        },
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
      alert("Cannot load exam details");
      router.push("/teacher/results");
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
    return `${mins} min`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: "Excellent", color: "bg-green-500" };
    if (score >= 80) return { text: "Good", color: "bg-blue-500" };
    if (score >= 70) return { text: "Fair", color: "bg-yellow-500" };
    if (score >= 60) return { text: "Average", color: "bg-orange-500" };
    return { text: "Poor", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600">Loading details...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Result not found
        </h3>
        <Button onClick={() => router.push("/teacher/results")}>
          Back to Results List
        </Button>
      </Card>
    );
  }

  const isPending = attempt.score === null || attempt.score === undefined;
  const badge = isPending
    ? { text: "Pending", color: "bg-purple-500" }
    : getScoreBadge(attempt.score!);
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const totalCount = attempt.answers.length;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/teacher/results")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">
            Exam Result Detail
          </h2>
          <p className="text-gray-600">{attempt.exam.title}</p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="h-6 w-6 text-purple-600" />
            <span>Student Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Student ID</div>
              <div className="font-semibold text-gray-800">
                {attempt.student.username}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Full Name</div>
              <div className="font-semibold text-gray-800">
                {attempt.student.name}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Class</div>
              <div className="font-semibold text-gray-800">
                {Array.isArray(attempt.student.courses)
                  ? attempt.student.courses.join(", ")
                  : typeof attempt.student.courses === "string"
                    ? attempt.student.courses
                      .split(",")
                      .map((c) => c.trim())
                      .join(", ")
                    : attempt.student.courses}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    Pending
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Needs Grading
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
                    {attempt.score!.toFixed(1)}/100
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Score</div>
                </>
              )}
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold text-gray-800">
                {correctCount}/{totalCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Correct Answers</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold text-gray-800">
                {formatDuration(attempt.timeSpent)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Time Spent</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold text-gray-800">
                {totalCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Questions</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Started:</span>
              <span className="ml-2 font-medium">
                {formatDate(attempt.startedAt)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Submitted:</span>
              <span className="ml-2 font-medium">
                {formatDate(attempt.submittedAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proctoring Video Section */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <Video className="h-6 w-6 text-indigo-600" />
              Proctoring Recording
            </span>
            <Button
              variant={showProctoringVideo ? "outline" : "default"}
              onClick={() => {
                setShowProctoringVideo(!showProctoringVideo);
                setVideoError(null);
              }}
              className={showProctoringVideo ? "" : "bg-indigo-600 hover:bg-indigo-700"}
            >
              {showProctoringVideo ? "Hide Video" : "View Recording"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showProctoringVideo && (
          <CardContent>
            {videoError ? (
              <div className="text-center py-8">
                <div className="text-yellow-600 mb-2">⚠️ {videoError}</div>
                <p className="text-sm text-gray-500">
                  No proctoring video available for this attempt.
                </p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden">
                <ProctoringViewer
                  attemptId={attemptId}
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Questions and Answers */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Detailed Answers
        </h3>

        {[...attempt.answers]
          .sort((a, b) => a.question.order - b.question.order)
          .map((answer, index) => {
            const isEssay =
              answer.question.type?.toLowerCase().includes("essay") ||
              answer.question.type?.toLowerCase().includes("text");
            const isGraded = isEssay
              ? answer.points !== null
              : answer.points > 0 || answer.isCorrect;

            return (
              <Card
                key={answer.id}
                className={`border-2 ${isEssay
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
                          Question {index + 1}
                        </Badge>
                        {isEssay ? (
                          <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
                            Essay
                          </Badge>
                        ) : (
                          <Badge
                            className={`${answer.isCorrect
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                              } text-white`}
                          >
                            {answer.isCorrect ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Correct
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Incorrect
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
                      <div className="text-sm text-gray-600">Points</div>
                      {isEssay && !isGraded ? (
                        <div className="text-lg font-bold text-purple-600">
                          Pending
                        </div>
                      ) : (
                        <div
                          className={`text-2xl font-bold ${isEssay
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
                          Student Answer:
                        </div>
                        <div className="text-gray-800 whitespace-pre-wrap">
                          {answer.answerText || (
                            <span className="text-gray-400 italic">
                              No answer provided
                            </span>
                          )}
                        </div>
                      </div>
                      {!isGraded && (
                        <div className="p-3 rounded-lg bg-purple-100 border border-purple-300 text-sm text-purple-800">
                          <span className="font-medium">ℹ️ Note:</span> This
                          essay question needs to be graded
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
                                  ✓ Correct Answer
                                </p>
                              )}
                              {isSelected && !isCorrect && (
                                <p className="text-sm text-red-600 font-medium mt-1">
                                  ✗ Student selected this option
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
          onClick={() => router.push("/teacher/results")}
          className="min-w-[200px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results List
        </Button>
        {isPending && (
          <Button
            onClick={() =>
              router.push(`/teacher/grading?attemptId=${attemptId}`)
            }
            className="min-w-[200px] bg-gradient-to-r from-purple-600 to-purple-700"
          >
            Grade Essay Questions
          </Button>
        )}
      </div>
    </div>
  );
}
