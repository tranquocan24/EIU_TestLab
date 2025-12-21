"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  FileText,
  Activity,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  todayAttempts: number;
}

interface RecentActivity {
  id: string;
  type: "login" | "exam_created" | "exam_submitted" | "user_created";
  userName: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalExams: 0,
    todayAttempts: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();

      setStats({
        totalStudents: data.totalStudents,
        totalTeachers: data.totalTeachers,
        totalExams: data.totalExams,
        todayAttempts: data.todayAttempts,
      });

      setActivities(data.activities || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return "🔐";
      case "exam_created":
        return "📝";
      case "exam_submitted":
        return "✅";
      case "user_created":
        return "👤";
      default:
        return "📋";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="eiu-gradient-primary text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-yellow-300" />
            <h1 className="text-4xl font-bold">Quản trị hệ thống</h1>
            <Sparkles className="h-8 w-8 text-yellow-300" />
          </div>
          <p className="text-blue-100 text-lg">
            Tổng quan và quản lý toàn bộ hệ thống EIU TestLab
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={loadDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm text-blue-700 font-medium mb-1">
              Tổng số học sinh
            </div>
            <div className="text-4xl font-bold text-blue-900">
              {stats.totalStudents}
            </div>
            <div className="mt-2 text-xs text-blue-600">Đang hoạt động</div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-sm text-green-700 font-medium mb-1">
              Tổng số giáo viên
            </div>
            <div className="text-4xl font-bold text-green-900">
              {stats.totalTeachers}
            </div>
            <div className="mt-2 text-xs text-green-600">Đang giảng dạy</div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-sm text-purple-700 font-medium mb-1">
              Tổng số bài thi
            </div>
            <div className="text-4xl font-bold text-purple-900">
              {stats.totalExams}
            </div>
            <div className="mt-2 text-xs text-purple-600">Đã tạo</div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-sm text-orange-700 font-medium mb-1">
              Lượt thi hôm nay
            </div>
            <div className="text-4xl font-bold text-orange-900">
              {stats.todayAttempts}
            </div>
            <div className="mt-2 text-xs text-orange-600">Đang tăng</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="shadow-lg border-t-4 border-t-[#112444]">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-[#112444]">
            <Activity className="h-6 w-6" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="relative flex items-start gap-4 p-5 border-l-4 border-[#112444] bg-gradient-to-r from-blue-50/50 to-transparent rounded-r-xl hover:from-blue-100/70 hover:shadow-md smooth-transition"
                >
                  <div className="absolute -left-2 top-6 w-4 h-4 bg-[#112444] rounded-full border-4 border-white shadow-md"></div>
                  <div className="text-3xl ml-4">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed">
                      <span className="font-bold text-[#112444]">
                        {activity.userName}
                      </span>{" "}
                      <span className="text-gray-700">
                        {activity.description}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-7xl mb-4">📊</div>
              <p className="text-gray-500 text-lg">Chưa có hoạt động nào</p>
              <p className="text-gray-400 text-sm mt-2">
                Các hoạt động mới sẽ hiển thị ở đây
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
