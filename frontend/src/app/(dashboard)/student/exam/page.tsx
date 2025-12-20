"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";

// Prevent copying
const preventCopy = (e: ClipboardEvent) => {
  e.preventDefault();
  return false;
};

// Prevent right click
const preventContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  return false;
};

// Prevent text selection
const preventSelection = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    body {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
  return style;
};

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  type: string;
  options: Option[];
  points: number;
  order: number;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questions: Question[];
}

export default function ExamTakingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");

  console.log("[ExamPage] Mounted with examId:", examId);
  console.log("[ExamPage] Search params:", searchParams.toString());

  // Hide navbar when on exam page
  useEffect(() => {
    // Add class to body to hide navbar
    document.body.classList.add("exam-mode");

    // Add styles to hide navbar
    const style = document.createElement("style");
    style.id = "exam-mode-style";
    style.textContent = `
      .exam-mode nav,
      .exam-mode header,
      body.exam-mode > div > nav,
      body.exam-mode > div > header {
        display: none !important;
      }
      body.exam-mode {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.classList.remove("exam-mode");
      const existingStyle = document.getElementById("exam-mode-style");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Track when submitting to allow fullscreen exit
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false); // Show warning modal
  const fullscreenExitCountRef = useRef(0); // Use ref instead of state to avoid re-render loop
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0); // For UI display only
  const hasLoadedRef = useRef(false);
  const isHandlingFullscreenChangeRef = useRef(false); // Prevent multiple triggers
  const antiCheatEnabledRef = useRef(false); // Track if anti-cheat is enabled

  useEffect(() => {
    console.log(
      "[useEffect] examId:",
      examId,
      "hasLoaded:",
      hasLoadedRef.current
    );
    if (examId && !hasLoadedRef.current) {
      console.log("[useEffect] Calling loadExam");
      hasLoadedRef.current = true;
      loadExam(examId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Auto-submit function (defined before useEffect to avoid dependency issues)
  const autoSubmitExam = useCallback(async () => {
    if (!attemptId || !exam) return;

    try {
      const totalTime = (exam.duration || 0) * 60;
      const timeSpent = Math.floor((totalTime - timeRemaining) / 60);

      // Submit answers
      for (const [questionId, optionId] of Object.entries(answers)) {
        try {
          await api.submitAnswer(attemptId, questionId, optionId);
        } catch (error) {
          console.error("Error submitting answer:", error);
        }
      }

      // Submit attempt
      await api.submitAttempt(attemptId, timeSpent);

      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch((err) => console.error(err));
      }

      router.push("/student/results");
    } catch (error) {
      console.error("Error auto-submitting:", error);
    }
  }, [attemptId, exam, timeRemaining, answers, router]);

  // Anti-cheat measures: fullscreen + prevent copy
  useEffect(() => {
    if (!exam || antiCheatEnabledRef.current) return;

    // Don't enable anti-cheat automatically - wait for user to start exam
    // This prevents "Permissions check failed" error

    // Cleanup on unmount
    return () => {
      if (antiCheatEnabledRef.current) {
        disableAntiCheat();
      }
    };
  }, [exam]);

  const enableAntiCheat = async () => {
    if (antiCheatEnabledRef.current) return;

    let styleElement: HTMLStyleElement | null = null;

    try {
      // Enable fullscreen - MUST be called from user gesture
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }

      // Prevent copy/paste
      document.addEventListener("copy", preventCopy);
      document.addEventListener("cut", preventCopy);
      document.addEventListener("paste", preventCopy);

      // Prevent right click
      document.addEventListener("contextmenu", preventContextMenu);

      // Prevent text selection
      styleElement = preventSelection();

      antiCheatEnabledRef.current = true;
      console.log("✅ Anti-cheat measures enabled: Fullscreen + No Copy");
    } catch (error) {
      console.error("Error enabling anti-cheat:", error);
      throw error;
    }
  };

  const disableAntiCheat = () => {
    // Exit fullscreen
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch((err) => console.error("Error exiting fullscreen:", err));
    }

    // Remove event listeners
    document.removeEventListener("copy", preventCopy);
    document.removeEventListener("cut", preventCopy);
    document.removeEventListener("paste", preventCopy);
    document.removeEventListener("contextmenu", preventContextMenu);

    // Remove style (stored in enableAntiCheat scope)
    const styleElements = document.querySelectorAll("style[data-anti-cheat]");
    styleElements.forEach((el) => el.remove());

    antiCheatEnabledRef.current = false;
    console.log("✅ Anti-cheat measures disabled");
  };

  // Monitor fullscreen changes
  useEffect(() => {
    // Warn user when trying to exit fullscreen (unless submitting)
    const handleFullscreenChange = () => {
      console.log("🔍 Fullscreen change detected!");
      console.log("- document.fullscreenElement:", document.fullscreenElement);
      console.log("- exam:", exam ? "loaded" : "not loaded");
      console.log("- isSubmitting:", isSubmitting);
      console.log(
        "- antiCheatEnabledRef.current:",
        antiCheatEnabledRef.current
      );
      console.log(
        "- isHandlingFullscreenChangeRef.current:",
        isHandlingFullscreenChangeRef.current
      );

      // Prevent multiple simultaneous triggers
      if (isHandlingFullscreenChangeRef.current) {
        console.log("⏭️ Skipping fullscreen change - already handling");
        return;
      }

      // Check if user exited fullscreen (simplified condition for debugging)
      if (!document.fullscreenElement && exam && !isSubmitting) {
        isHandlingFullscreenChangeRef.current = true;

        // Use ref to avoid re-render loop
        fullscreenExitCountRef.current += 1;
        const newCount = fullscreenExitCountRef.current;

        // Update state for UI display
        setFullscreenExitCount(newCount);

        console.log(`⚠️ Fullscreen exit count: ${newCount}/3`);

        if (newCount >= 3) {
          // Auto submit after 3 warnings
          alert(
            "⚠️ Bạn đã thoát chế độ toàn màn hình 3 lần. Hệ thống sẽ tự động nộp bài của bạn."
          );
          // Trigger submit through state change
          setIsSubmitting(true);
          // Call submit directly
          if (attemptId) {
            autoSubmitExam();
          }
        } else {
          // Show warning modal
          console.log("📢 Showing fullscreen warning modal");
          setShowFullscreenWarning(true);
        }

        // Reset flag after a delay
        setTimeout(() => {
          isHandlingFullscreenChangeRef.current = false;
        }, 1000);
      } else {
        console.log(
          "ℹ️ Fullscreen change ignored (entering fullscreen or conditions not met)"
        );
      }
    };

    console.log("✅ Adding fullscreen change listener");
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Cleanup on unmount
    return () => {
      console.log("🧹 Removing fullscreen change listener");
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [exam, isSubmitting, attemptId, autoSubmitExam]);

  const handleReturnToFullscreen = async () => {
    setShowFullscreenWarning(false);

    // Reset the handling flag to allow next detection
    isHandlingFullscreenChangeRef.current = false;

    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
    } catch (error) {
      console.error("Error entering fullscreen:", error);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      alert("Lỗi: Không tìm thấy phiên làm bài");
      return;
    }

    try {
      // Calculate time spent (in minutes)
      const totalTime = (exam?.duration || 0) * 60;
      const timeSpent = Math.floor((totalTime - timeRemaining) / 60);

      console.log("=== SUBMITTING EXAM ===");
      console.log("Attempt ID:", attemptId);
      console.log("Time spent:", timeSpent, "minutes");
      console.log("Total answers:", Object.keys(answers).length);
      console.log("Answers:", answers);

      // Submit all answers first
      let successCount = 0;
      let errorCount = 0;

      for (const [questionId, answer] of Object.entries(answers)) {
        try {
          // Find the question to check if it's essay type
          const question = exam?.questions.find((q) => q.id === questionId);
          const isEssay = question?.type?.toLowerCase().includes("essay");

          console.log(
            `Submitting answer for question ${questionId}: ${answer} (${
              isEssay ? "essay" : "multiple-choice"
            })`
          );

          if (isEssay) {
            // For essay questions, send as textAnswer
            await api.submitAnswer(attemptId, questionId, "", answer);
          } else {
            // For multiple choice, send as selectedOption
            await api.submitAnswer(attemptId, questionId, answer);
          }
          successCount++;
          console.log(`✓ Answer ${successCount} submitted successfully`);
        } catch (error: unknown) {
          errorCount++;
          console.error(
            `✗ Error submitting answer for question ${questionId}:`,
            error
          );
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as {
              response?: { status?: number; data?: unknown };
            };
            console.error("Error details:", {
              status: axiosError.response?.status,
              data: axiosError.response?.data,
            });
          }
        }
      }

      console.log(
        `Answers submitted: ${successCount} success, ${errorCount} failed`
      );

      // Submit the attempt
      console.log("Submitting attempt...");
      const result = await api.submitAttempt(attemptId, timeSpent);
      console.log("✓ Attempt submitted successfully:", result);

      // Set submitting flag to prevent fullscreen warning
      setIsSubmitting(true);

      // Exit fullscreen before navigating
      if (document.fullscreenElement) {
        await document
          .exitFullscreen()
          .catch((err) => console.error("Error exiting fullscreen:", err));
      }

      // Navigate to results page
      alert("Nộp bài thành công!");
      router.push(`/student/results`);
    } catch (error: unknown) {
      console.error("=== ERROR SUBMITTING EXAM ===");
      console.error("Error:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: unknown; statusText?: string };
        };
        console.error("Error details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
        });
      }
      alert("Có lỗi khi nộp bài. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && exam) {
      // Auto submit when time is up
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, exam]);

  const loadExam = async (id: string) => {
    try {
      console.log("[loadExam] Starting...");
      setLoading(true);

      console.log("Loading exam with ID:", id);
      console.log(
        "Token:",
        localStorage.getItem("token") ? "Present" : "Missing"
      );

      // Load exam from API with timeout
      console.log("[loadExam] Calling api.getExamById...");
      const examData = await Promise.race([
        api.getExamById(id),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timeout after 10 seconds")),
            10000
          )
        ),
      ]);
      console.log("Loaded exam:", examData);

      // Transform to component format
      const transformedExam: Exam = {
        id: examData.id,
        title: examData.title,
        subject: examData.subject || "N/A",
        duration: examData.duration || 60,
        questions: examData.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          type: q.type || "MULTIPLE_CHOICE",
          options: q.options || [],
          points: q.points,
          order: q.order,
        })),
      };

      setExam(transformedExam);
      setTimeRemaining(transformedExam.duration * 60); // Convert to seconds

      // Start attempt
      try {
        console.log("Starting attempt for exam:", id);
        const attempt = await api.startExam(id);
        console.log("Started attempt:", attempt);
        setAttemptId(attempt.id);
      } catch (error: any) {
        console.error("Error starting attempt:", error);
        console.error("Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Không thể bắt đầu bài thi";
        alert(`Lỗi: ${errorMessage}`);

        // Navigate back to exam list
        router.push("/student/exams");
        return;
      }
    } catch (error: any) {
      console.error("Error loading exam:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải bài thi. Vui lòng thử lại.";
      alert(`Lỗi: ${errorMessage}`);

      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.push("/login");
      } else {
        router.push("/student/exams");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    });

    // Auto-advance to next question after selecting answer (except for last question)
    // Only for multiple choice, not for essay questions
    const currentQ = exam?.questions[currentQuestion];
    const isEssay = currentQ?.type?.toLowerCase().includes("essay");

    if (exam && currentQuestion < exam.questions.length - 1 && !isEssay) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300); // Small delay for better UX
    }
  };

  const getTimeColor = () => {
    if (timeRemaining > 600) return "text-green-600";
    if (timeRemaining > 300) return "text-yellow-600";
    return "text-red-600";
  };

  // Enable anti-cheat when exam is loaded
  useEffect(() => {
    if (exam && !antiCheatEnabledRef.current) {
      // Check if already in fullscreen (from previous page)
      if (document.fullscreenElement) {
        console.log("✅ Already in fullscreen mode");
        // Just enable other anti-cheat measures (not fullscreen)
        document.addEventListener("copy", preventCopy);
        document.addEventListener("cut", preventCopy);
        document.addEventListener("paste", preventCopy);
        document.addEventListener("contextmenu", preventContextMenu);

        const styleElement = preventSelection();
        antiCheatEnabledRef.current = true;

        console.log(
          "✅ Anti-cheat measures enabled (fullscreen already active)"
        );
      } else {
        // Not in fullscreen - show warning
        console.warn("⚠️ Not in fullscreen mode - user needs to enable it");
        alert("Vui lòng bật chế độ toàn màn hình để tiếp tục làm bài!");

        // Try to enable fullscreen
        enableAntiCheat().catch((error) => {
          console.error("Failed to enable anti-cheat:", error);
        });
      }
    }
  }, [exam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài thi...</p>
          {!examId && (
            <p className="text-red-600 mt-2 text-sm">
              Lỗi: Không tìm thấy ID bài thi trong URL
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!examId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Không tìm thấy bài thi
        </h2>
        <p className="text-gray-600 mb-4">URL không chứa ID bài thi</p>
        <Button onClick={() => router.push("/student/exams")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Không tìm thấy bài thi
        </h2>
        <Button onClick={() => router.push("/student/exams")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Check if exam has questions
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Bài thi chưa có câu hỏi
        </h2>
        <p className="text-gray-600 mb-4">
          Vui lòng liên hệ giáo viên để biết thêm thông tin.
        </p>
        <Button onClick={() => router.push("/student/exams")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Get current question safely
  const question = exam.questions[currentQuestion];
  if (!question) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Lỗi hiển thị câu hỏi
        </h2>
        <Button onClick={() => router.push("/student/exams")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 pb-6 sm:pb-8 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white p-4 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">{exam.title}</h1>
            <p className="text-sm sm:text-base text-blue-100">{exam.subject}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className={`text-3xl sm:text-4xl font-bold ${getTimeColor()}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-xs sm:text-sm text-blue-100">
              Thời gian còn lại
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              Câu {currentQuestion + 1} / {exam.questions.length}
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              Đã trả lời: {Object.keys(answers).length} /{" "}
              {exam.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestion + 1) / exam.questions.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-800">
            Câu hỏi {currentQuestion + 1}
            {question.type?.toLowerCase().includes("essay") && (
              <span className="ml-2 text-xs sm:text-sm font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded">
                Tự luận
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            {question.questionText}
          </p>

          {/* Essay question - show textarea */}
          {question.type?.toLowerCase().includes("essay") ? (
            <div className="space-y-3 bg-purple-50 p-4 sm:p-6 rounded-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <label className="text-base font-semibold text-purple-700">
                  Nhập câu trả lời của bạn:
                </label>
              </div>
              <textarea
                className="w-full p-4 text-base border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all min-h-[200px] sm:min-h-[250px] resize-y bg-white shadow-sm"
                placeholder="Nhập câu trả lời tự luận của bạn tại đây...&#10;&#10;Gợi ý: Hãy trình bày câu trả lời rõ ràng, mạch lạc và đầy đủ."
                value={answers[question.id] || ""}
                onChange={(e) => {
                  const newAnswers = { ...answers };
                  newAnswers[question.id] = e.target.value;
                  setAnswers(newAnswers);
                }}
              />
              <div className="flex items-start gap-2 bg-purple-100 p-3 rounded-md">
                <svg
                  className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-purple-700">
                  <p className="font-medium">Lưu ý:</p>
                  <p className="mt-1">
                    Câu trả lời tự luận sẽ được giáo viên chấm điểm thủ công.
                    Hãy trình bày đầy đủ và rõ ràng.
                  </p>
                  <p className="mt-1 text-xs text-purple-600">
                    Đã nhập:{" "}
                    <span className="font-semibold">
                      {(answers[question.id] || "").length}
                    </span>{" "}
                    ký tự
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Multiple choice question - show options */
            <div className="space-y-2 sm:space-y-3">
              {question.options.map((option) => {
                const questionId = question.id;
                const isSelected = answers[questionId] === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(questionId, option.id)}
                    className={`w-full p-3 sm:p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="flex-1 text-sm sm:text-base text-gray-700">
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:justify-between sm:items-center">
        {/* Previous/Next buttons for mobile - shown at top */}
        <div className="flex justify-between items-center sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            ← Câu trước
          </Button>

          {currentQuestion === exam.questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Nộp bài
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() =>
                setCurrentQuestion(
                  Math.min(exam.questions.length - 1, currentQuestion + 1)
                )
              }
            >
              Câu tiếp →
            </Button>
          )}
        </div>

        {/* Desktop - Previous button */}
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="hidden sm:inline-flex"
        >
          ← Câu trước
        </Button>

        {/* Question number indicators - scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-2 min-w-max sm:min-w-0">
            {exam.questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined;
              const isCurrent = currentQuestion === index;

              let buttonClass =
                "w-10 h-10 flex-shrink-0 rounded-full font-medium transition-all ";
              if (isCurrent) {
                buttonClass += "bg-blue-600 text-white";
              } else if (isAnswered) {
                buttonClass +=
                  "bg-green-100 text-green-700 border border-green-300";
              } else {
                buttonClass +=
                  "bg-gray-100 text-gray-600 border border-gray-300";
              }

              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={buttonClass}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop - Next/Submit button */}
        {currentQuestion === exam.questions.length - 1 ? (
          <Button
            onClick={() => setShowSubmitDialog(true)}
            className="bg-green-600 hover:bg-green-700 hidden sm:inline-flex"
          >
            Nộp bài
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentQuestion(
                Math.min(exam.questions.length - 1, currentQuestion + 1)
              )
            }
            className="hidden sm:inline-flex"
          >
            Câu tiếp →
          </Button>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nộp bài</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bài, bạn không
              thể thay đổi câu trả lời.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng số câu hỏi:</span>
              <span className="font-semibold">{exam.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã trả lời:</span>
              <span className="font-semibold text-green-600">
                {Object.keys(answers).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chưa trả lời:</span>
              <span className="font-semibold text-red-600">
                {exam.questions.length - Object.keys(answers).length}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              Kiểm tra lại
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Xác nhận nộp bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Warning Dialog */}
      <Dialog
        open={showFullscreenWarning}
        onOpenChange={setShowFullscreenWarning}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Cảnh báo bảo mật
            </DialogTitle>
            <DialogDescription>
              Bạn đã thoát chế độ toàn màn hình!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold text-center">
                ⚠️ Còn {3 - fullscreenExitCount} lần cảnh báo
              </p>
              <p className="text-red-600 text-sm text-center mt-1">
                Sau {3 - fullscreenExitCount} lần thoát nữa, hệ thống sẽ tự động
                nộp bài!
              </p>
            </div>

            <p className="text-gray-700 mb-4">
              Để đảm bảo tính công bằng trong kỳ thi, bạn cần ở chế độ toàn màn
              hình trong suốt quá trình làm bài.
            </p>
            <p className="text-gray-700">
              Vui lòng bấm nút bên dưới để quay lại chế độ toàn màn hình và tiếp
              tục làm bài.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={handleReturnToFullscreen}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Quay lại chế độ toàn màn hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
