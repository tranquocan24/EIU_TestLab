"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  RefreshCw,
  Search,
} from "lucide-react";
import api from "@/lib/api";

interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count?: {
    enrollments: number;
  };
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add/Edit Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Manage Users Dialog
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledUsers, setEnrolledUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }
    loadCourses();
  }, [isAuthenticated, user, router]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    if (!formData.code || !formData.name) {
      alert("Vui lòng nhập mã lớp và tên lớp");
      return;
    }

    try {
      await api.createCourse(formData);
      alert("Tạo lớp học thành công!");
      setIsAddDialogOpen(false);
      setFormData({ code: "", name: "", description: "", isActive: true });
      loadCourses();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleEditCourse = async () => {
    if (!editingCourse) return;

    try {
      await api.updateCourse(editingCourse.id, formData);
      alert("Cập nhật thành công!");
      setIsEditDialogOpen(false);
      setEditingCourse(null);
      setFormData({ code: "", name: "", description: "", isActive: true });
      loadCourses();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Xóa lớp "${course.code}"?`)) return;

    try {
      await api.deleteCourse(course.id);
      alert("Xóa thành công!");
      loadCourses();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description || "",
      isActive: course.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openManageDialog = async (course: Course) => {
    setSelectedCourse(course);
    setIsManageDialogOpen(true);
    await loadCourseUsers(course.id);
  };

  const loadCourseUsers = async (courseId: string) => {
    try {
      const [enrolled, available] = await Promise.all([
        api.getEnrolledUsers(courseId),
        api.getAvailableUsers(courseId),
      ]);
      setEnrolledUsers(enrolled);
      setAvailableUsers(available);
      setSelectedUserIds([]);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleEnrollUsers = async () => {
    if (!selectedCourse || selectedUserIds.length === 0) return;

    try {
      await api.enrollUsers(selectedCourse.id, selectedUserIds);
      alert("Phân công thành công!");
      await loadCourseUsers(selectedCourse.id);
      loadCourses();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleUnenrollUser = async (userId: string) => {
    if (!selectedCourse || !confirm("Hủy phân công?")) return;

    try {
      await api.unenrollUsers(selectedCourse.id, [userId]);
      alert("Đã hủy phân công!");
      await loadCourseUsers(selectedCourse.id);
      loadCourses();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="eiu-gradient-primary text-white p-8 rounded-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        <div className="relative z-10">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">Quản lý lớp học</h1>
          <p className="text-blue-100">
            Tạo lớp và phân công giáo viên, học sinh
          </p>
        </div>
      </div>

      {/* Actions */}
      <Card className="border-t-4 border-t-[#112444]">
        <CardContent className="p-4">
          <div className="flex justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã lớp hoặc tên lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 smooth-transition"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={loadCourses}
                className="smooth-transition hover:border-[#112444] hover:text-[#112444]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#112444] hover:bg-[#1a365d] smooth-transition">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm lớp
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm lớp học mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Mã lớp *</Label>
                      <Input
                        placeholder="CSE301"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Tên lớp *</Label>
                      <Input
                        placeholder="Lập trình Web"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Input
                        placeholder="Mô tả về lớp học"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleAddCourse}
                        className="flex-1 bg-[#112444] hover:bg-[#1a365d] smooth-transition"
                      >
                        Tạo lớp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="flex-1 smooth-transition"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card border-l-4 border-l-[#112444]">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">Tổng số lớp</div>
            <div className="text-3xl font-bold text-[#112444]">
              {courses.length}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">Đang hoạt động</div>
            <div className="text-3xl font-bold text-green-600">
              {courses.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">Tổng sinh viên</div>
            <div className="text-3xl font-bold text-blue-600">
              {courses.reduce(
                (sum, c) => sum + (c._count?.enrollments || 0),
                0
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">TB/lớp</div>
            <div className="text-3xl font-bold text-orange-600">
              {courses.length > 0
                ? Math.round(
                    courses.reduce(
                      (sum, c) => sum + (c._count?.enrollments || 0),
                      0
                    ) / courses.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <Card className="card-hover-lift overflow-hidden pt-0">
        <CardHeader className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white py-4 px-6">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Danh sách lớp học ({filteredCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Mã lớp
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tên lớp
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Mô tả
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Số người
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course, index) => (
                    <tr
                      key={course.id}
                      className={`border-b table-row-hover ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <span className="font-semibold text-[#112444]">
                          {course.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {course.name}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {course.description || "-"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          <Users className="h-3 w-3 mr-1" />
                          {course._count?.enrollments || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openManageDialog(course)}
                            className="smooth-transition hover:bg-blue-50"
                            title="Quản lý người dùng"
                          >
                            <Users className="h-4 w-4 text-[#112444]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(course)}
                            className="smooth-transition hover:bg-orange-50"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4 text-orange-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course)}
                            className="smooth-transition hover:bg-red-50"
                            title="Xóa"
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
          ) : (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">
                Chưa có lớp học nào
              </p>
              <p className="text-sm text-gray-500">
                Bắt đầu bằng cách tạo lớp học mới
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lớp học</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Mã lớp</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tên lớp</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleEditCourse}
                className="flex-1 bg-[#112444] hover:bg-[#1a365d] smooth-transition"
              >
                Cập nhật
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 smooth-transition"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Users Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phân công - {selectedCourse?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Enrolled */}
            <div>
              <h3 className="font-semibold mb-3">
                Đã phân công ({enrolledUsers.length})
              </h3>
              {enrolledUsers.length > 0 ? (
                <div className="border rounded-lg max-h-60 overflow-y-auto shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-3 font-semibold">
                          Tên
                        </th>
                        <th className="text-left py-3 px-3 font-semibold">
                          Username
                        </th>
                        <th className="text-left py-3 px-3 font-semibold">
                          Vai trò
                        </th>
                        <th className="text-center py-3 px-3 font-semibold">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledUsers.map((u, index) => (
                        <tr
                          key={u.id}
                          className={`border-t table-row-hover ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="py-2 px-3">{u.name}</td>
                          <td className="py-2 px-3">{u.username}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnenrollUser(u.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có người dùng</p>
              )}
            </div>

            {/* Available */}
            <div>
              <h3 className="font-semibold mb-3">
                Người dùng khả dụng ({availableUsers.length})
              </h3>
              {availableUsers.length > 0 ? (
                <>
                  <div className="border rounded-lg max-h-60 overflow-y-auto shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-white sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-3">
                            <input
                              type="checkbox"
                              checked={
                                selectedUserIds.length === availableUsers.length
                              }
                              onChange={(e) => {
                                setSelectedUserIds(
                                  e.target.checked
                                    ? availableUsers.map((u) => u.id)
                                    : []
                                );
                              }}
                              className="smooth-transition"
                            />
                          </th>
                          <th className="text-left py-3 px-3 font-semibold">
                            Tên
                          </th>
                          <th className="text-left py-3 px-3 font-semibold">
                            Username
                          </th>
                          <th className="text-left py-3 px-3 font-semibold">
                            Vai trò
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableUsers.map((u, index) => (
                          <tr
                            key={u.id}
                            className={`border-t cursor-pointer table-row-hover ${
                              selectedUserIds.includes(u.id)
                                ? "bg-blue-100"
                                : index % 2 === 0
                                ? "bg-white"
                                : "bg-gray-50/50"
                            }`}
                            onClick={() => {
                              setSelectedUserIds((prev) =>
                                prev.includes(u.id)
                                  ? prev.filter((id) => id !== u.id)
                                  : [...prev, u.id]
                              );
                            }}
                          >
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                readOnly
                                className="smooth-transition"
                              />
                            </td>
                            <td className="py-3 px-3 font-medium">{u.name}</td>
                            <td className="py-3 px-3 text-gray-600">
                              {u.username}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                {u.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={handleEnrollUsers}
                      disabled={selectedUserIds.length === 0}
                      className="flex-1 bg-[#112444] hover:bg-[#1a365d] smooth-transition disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Phân công ({selectedUserIds.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUserIds([])}
                      className="smooth-transition"
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Không có người dùng khả dụng
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
