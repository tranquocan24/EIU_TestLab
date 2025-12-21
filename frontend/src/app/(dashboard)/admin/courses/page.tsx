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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-8 rounded-2xl text-center">
        <h1 className="text-3xl font-bold mb-2">Quản lý lớp học</h1>
        <p className="text-red-100">Tạo lớp và phân công giáo viên, học sinh</p>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadCourses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleAddCourse} className="flex-1">
                    Tạo lớp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Tổng số lớp</div>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Đang hoạt động</div>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Tổng sinh viên</div>
            <div className="text-2xl font-bold text-blue-600">
              {courses.reduce(
                (sum, c) => sum + (c._count?.enrollments || 0),
                0
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">TB/lớp</div>
            <div className="text-2xl font-bold text-orange-600">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Danh sách lớp học ({filteredCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4">Mã lớp</th>
                    <th className="text-left py-3 px-4">Tên lớp</th>
                    <th className="text-left py-3 px-4">Mô tả</th>
                    <th className="text-center py-3 px-4">Số người</th>
                    <th className="text-center py-3 px-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{course.code}</td>
                      <td className="py-3 px-4">{course.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {course.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {course._count?.enrollments || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openManageDialog(course)}
                          >
                            <Users className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(course)}
                          >
                            <Edit className="h-4 w-4 text-orange-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course)}
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
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Chưa có lớp học nào</p>
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
              <Button onClick={handleEditCourse} className="flex-1">
                Cập nhật
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
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
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3">Tên</th>
                        <th className="text-left py-2 px-3">Username</th>
                        <th className="text-left py-2 px-3">Vai trò</th>
                        <th className="text-center py-2 px-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledUsers.map((u) => (
                        <tr key={u.id} className="border-t">
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
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3">
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
                            />
                          </th>
                          <th className="text-left py-2 px-3">Tên</th>
                          <th className="text-left py-2 px-3">Username</th>
                          <th className="text-left py-2 px-3">Vai trò</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableUsers.map((u) => (
                          <tr
                            key={u.id}
                            className={`border-t cursor-pointer hover:bg-gray-50 ${
                              selectedUserIds.includes(u.id) ? "bg-blue-50" : ""
                            }`}
                            onClick={() => {
                              setSelectedUserIds((prev) =>
                                prev.includes(u.id)
                                  ? prev.filter((id) => id !== u.id)
                                  : [...prev, u.id]
                              );
                            }}
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                readOnly
                              />
                            </td>
                            <td className="py-2 px-3">{u.name}</td>
                            <td className="py-2 px-3">{u.username}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
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
                      className="flex-1"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Phân công ({selectedUserIds.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUserIds([])}
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
