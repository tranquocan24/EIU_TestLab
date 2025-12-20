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
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Download,
  RefreshCw,
  Eye,
  Search,
} from "lucide-react";
import api from "@/lib/api";

interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  score: number;
  timeSpent: number;
  submittedAt: string;
}

interface ExamOption {
  id: string;
  title: string;
}

export default function ViewResultsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [scoreRangeFilter, setScoreRangeFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "teacher") {
      router.push("/login");
      return;
    }

    loadExams();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedExam) {
      loadResults(selectedExam);
    }
  }, [selectedExam]);

  useEffect(() => {
    filterResults();
  }, [results, searchQuery, classFilter, scoreRangeFilter]);

  const loadExams = async () => {
    try {
      const examsData = await api.getExams();
      console.log("Loaded teacher exams:", examsData);

      const examOptions = examsData.map((exam) => ({
        id: exam.id,
        title: exam.title,
      }));

      setExams(examOptions);
    } catch (error) {
      console.error("Error loading exams:", error);
    }
  };

  const loadResults = async (examId: string) => {
    try {
      setLoading(true);
      const attempts = await api.getExamAttempts(examId);
      console.log("Loaded attempts for exam:", examId, attempts);

      const transformedResults = attempts
        .filter((attempt) => attempt.submittedAt)
        .map((attempt) => ({
          id: attempt.id,
          studentId: attempt.student?.username || "N/A",
          studentName: attempt.student?.name || "Unknown",
          className: attempt.student?.courses || "N/A",
          score: attempt.score || 0,
          timeSpent: attempt.timeSpent || 0,
          submittedAt: attempt.submittedAt,
        }));

      setResults(transformedResults);
    } catch (error) {
      console.error("Error loading results:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(query) ||
          r.studentId.toLowerCase().includes(query)
      );
    }

    if (classFilter && classFilter !== "all") {
      filtered = filtered.filter((r) => r.className.includes(classFilter));
    }

    if (scoreRangeFilter && scoreRangeFilter !== "all") {
      filtered = filtered.filter((r) => {
        switch (scoreRangeFilter) {
          case "excellent":
            return r.score >= 90;
          case "good":
            return r.score >= 80 && r.score < 90;
          case "average":
            return r.score >= 70 && r.score < 80;
          case "weak":
            return r.score >= 60 && r.score < 70;
          case "poor":
            return r.score < 60;
          default:
            return true;
        }
      });
    }

    setFilteredResults(filtered);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90)
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          Excellent
        </span>
      );
    if (score >= 80)
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
          Good
        </span>
      );
    if (score >= 70)
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
          Fair
        </span>
      );
    if (score >= 60)
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
          Average
        </span>
      );
    return (
      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
        Poor
      </span>
    );
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return (
      date.toLocaleDateString("vi-VN") +
      " " +
      date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const stats =
    selectedExam && results.length > 0
      ? {
          total: results.length,
          average: (
            results.reduce((sum, r) => sum + r.score, 0) / results.length
          ).toFixed(1),
          highest: Math.max(...results.map((r) => r.score)).toFixed(1),
          lowest: Math.min(...results.map((r) => r.score)).toFixed(1),
        }
      : null;

  const handleExportResults = () => {
    if (!selectedExam || filteredResults.length === 0) {
      alert("Please select an exam with results to export");
      return;
    }

    const selectedExamTitle =
      exams.find((e) => e.id === selectedExam)?.title || "exam";
    const headers = [
      "No.",
      "Student ID",
      "Name",
      "Class",
      "Score",
      "Time (min)",
      "Submitted",
    ];
    const rows = filteredResults.map((result, index) => [
      index + 1,
      result.studentId,
      result.studentName,
      result.className,
      result.score.toFixed(1),
      result.timeSpent,
      formatDateTime(result.submittedAt),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedExamTitle}_results.csv`;
    link.click();
  };

  const handleViewResult = (attemptId: string) => {
    router.push(`/teacher/results/${attemptId}`);
  };

  const uniqueClasses = Array.from(
    new Set(results.map((r) => r.className).filter((c) => c !== "N/A"))
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Student Exam Results
          </h1>
          <p className="text-gray-600 mt-1">
            View and analyze student exam results
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => selectedExam && loadResults(selectedExam)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <label
              htmlFor="exam-select"
              className="text-sm font-medium text-gray-700"
            >
              Select exam to view results:
            </label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger id="exam-select" className="w-full md:w-96">
                <SelectValue placeholder="-- Select Exam --" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedExam && (
        <>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        Students Participated
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.total}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        Average Score
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.average}/100
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        Highest Score
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.highest}/100
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <TrendingDown className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        Lowest Score
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.lowest}/100
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or student ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={scoreRangeFilter}
                  onValueChange={setScoreRangeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="excellent">
                      Excellent (90-100)
                    </SelectItem>
                    <SelectItem value="good">Good (80-89)</SelectItem>
                    <SelectItem value="average">Fair (70-79)</SelectItem>
                    <SelectItem value="weak">Average (60-69)</SelectItem>
                    <SelectItem value="poor">Poor (&lt;60)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading exam results...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredResults.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Results List ({filteredResults.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          No.
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Student ID
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Class
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Score
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Time
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Submitted
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result, index) => (
                        <tr
                          key={result.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-800">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-gray-800 font-medium">
                            {result.studentId}
                          </td>
                          <td className="py-3 px-4 text-gray-800">
                            {result.studentName}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {result.className}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-purple-600">
                                {result.score.toFixed(1)}/100
                              </span>
                              {getScoreBadge(result.score)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {result.timeSpent} min
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {formatDateTime(result.submittedAt)}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResult(result.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
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
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No exam results yet
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery ||
                    classFilter !== "all" ||
                    scoreRangeFilter !== "all"
                      ? "No results match your filters"
                      : "No students have taken this exam yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedExam && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Select an exam to view results
              </h3>
              <p className="text-gray-500">
                Please select an exam from the list above to view detailed
                results
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
