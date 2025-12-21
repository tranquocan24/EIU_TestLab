"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart as BarChartIcon,
  Users,
  FileText,
  TrendingUp,
  Download,
  Calendar,
  Activity,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/lib/api";

interface LoginStats {
  date: string;
  logins: number;
}

interface ExamStats {
  subject: string;
  totalExams: number;
  totalSubmissions: number;
  averageScore: number;
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7days");
  const [loginStats, setLoginStats] = useState<LoginStats[]>([]);
  const [examStats, setExamStats] = useState<ExamStats[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }

    loadStats();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Parse timeRange to days
      const daysMap: Record<string, number> = {
        "7days": 7,
        "30days": 30,
        "90days": 90,
        year: 365,
      };
      const days = daysMap[timeRange] || 7;

      // Load login stats and exam stats from API
      const [loginData, examData] = await Promise.all([
        api.getLoginStats(days),
        api.getExamStatsBySubject(),
      ]);

      setLoginStats(loginData);
      setExamStats(examData);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalLogins = loginStats.reduce((sum, stat) => sum + stat.logins, 0);
  const averageLogins =
    loginStats.length > 0 ? Math.round(totalLogins / loginStats.length) : 0;
  const maxLogins = Math.max(...loginStats.map((s) => s.logins), 0);

  const handleExportStats = () => {
    alert("Chức năng xuất báo cáo đang được phát triển!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="eiu-gradient-primary text-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Thống kê hệ thống</h1>
            </div>
            <p className="text-blue-100 ml-11">
              Phân tích và báo cáo hoạt động hệ thống
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48 bg-white/10 border-white/30 text-white focus:ring-2 focus:ring-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
                <SelectItem value="90days">90 ngày qua</SelectItem>
                <SelectItem value="year">Năm nay</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExportStats}
              className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#112444] smooth-transition"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {/* Login Statistics */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-[#112444]">
            <Calendar className="h-6 w-6" />
            Thống kê đăng nhập
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-blue-700 font-medium">
                    Tổng lượt đăng nhập
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {totalLogins}
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="text-sm text-green-700 font-medium">
                    Trung bình/ngày
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {averageLogins}
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <div className="text-sm text-purple-700 font-medium">
                    Cao nhất
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {maxLogins}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-[300px] w-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={loginStats}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#112444", fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fill: "#112444", fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "2px solid #112444",
                    borderRadius: "12px",
                    boxShadow: "0 8px 16px -4px rgb(17 36 68 / 0.2)",
                  }}
                  labelStyle={{ color: "#112444", fontWeight: 700 }}
                  cursor={{ fill: "rgba(17, 36, 68, 0.05)" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px", fontWeight: 600 }}
                  iconType="rect"
                />
                <Bar
                  dataKey="logins"
                  fill="#112444"
                  name="Số lượt đăng nhập"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Exam Statistics by Subject */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-[#112444]">
            <BarChartIcon className="h-6 w-6" />
            Thống kê theo môn học
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#112444] text-white">
                  <th className="text-left py-4 px-4 font-semibold">Môn học</th>
                  <th className="text-left py-4 px-4 font-semibold">
                    Số đề thi
                  </th>
                  <th className="text-left py-4 px-4 font-semibold">
                    Lượt thi
                  </th>
                  <th className="text-left py-4 px-4 font-semibold">Điểm TB</th>
                  <th className="text-left py-4 px-4 font-semibold">Phân bố</th>
                </tr>
              </thead>
              <tbody>
                {examStats.map((stat, index) => {
                  const maxSubmissions = Math.max(
                    ...examStats.map((s) => s.totalSubmissions)
                  );
                  const percentage =
                    maxSubmissions > 0
                      ? (stat.totalSubmissions / maxSubmissions) * 100
                      : 0;

                  return (
                    <tr
                      key={stat.subject}
                      className={`table-row-hover border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {stat.subject}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {stat.totalExams}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {stat.totalSubmissions}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#112444]">
                          {stat.averageScore}/10
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-100 rounded-full h-7 overflow-hidden shadow-inner">
                          <div
                            className="eiu-gradient-secondary h-full rounded-full smooth-transition flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 15 && (
                              <span className="text-xs font-semibold text-white">
                                {Math.round(percentage)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-red-700 font-medium">
                  Tổng đề thi
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {examStats.reduce((sum, s) => sum + s.totalExams, 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-green-700 font-medium">
                  Tổng lượt thi
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {examStats.reduce((sum, s) => sum + s.totalSubmissions, 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#112444] rounded-xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-blue-700 font-medium">
                  Điểm TB chung
                </div>
                <div className="text-3xl font-bold text-[#112444]">
                  {examStats.length > 0
                    ? (
                        examStats.reduce((sum, s) => sum + s.averageScore, 0) /
                        examStats.length
                      ).toFixed(1)
                    : "0"}
                  /10
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
