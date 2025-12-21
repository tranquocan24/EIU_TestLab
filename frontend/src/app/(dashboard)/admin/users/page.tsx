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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Sparkles,
  Shield,
  GraduationCap,
  Users as UsersIcon,
} from "lucide-react";
import api from "@/lib/api";

interface CourseEnrollment {
  course: {
    id: string;
    code: string;
    name: string;
  };
}

interface User {
  id: string;
  username: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  email?: string;
  courses?: string[];
  coursesEnrolled?: CourseEnrollment[];
  createdAt: string;
}

// Helper function to get all courses from both old and new system
const getUserCourses = (user: User): { code: string; name?: string }[] => {
  const coursesMap = new Map<string, { code: string; name?: string }>();

  // Add courses from old system
  if (user.courses && user.courses.length > 0) {
    user.courses.forEach((code) => {
      coursesMap.set(code, { code });
    });
  }

  // Add courses from new system (with course names)
  if (user.coursesEnrolled && user.coursesEnrolled.length > 0) {
    user.coursesEnrolled.forEach((enrollment) => {
      coursesMap.set(enrollment.course.code, {
        code: enrollment.course.code,
        name: enrollment.course.name,
      });
    });
  }

  return Array.from(coursesMap.values());
};

export default function ManageUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "STUDENT",
    email: "",
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "STUDENT",
    password: "",
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }

    loadUsers();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const users = await api.getUsers();
      setUsers(users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Không thể tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query))
      );
    }

    // Apply role filter
    if (roleFilter && roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter.toUpperCase());
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STUDENT":
        return (
          <span className="inline-flex items-center justify-center min-w-[90px] px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold whitespace-nowrap">
            Học sinh
          </span>
        );
      case "TEACHER":
        return (
          <span className="inline-flex items-center justify-center min-w-[90px] px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold whitespace-nowrap">
            Giáo viên
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center justify-center min-w-[90px] px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold whitespace-nowrap">
            Quản trị
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const handleAddUser = async () => {
    try {
      // Validate required fields
      if (!formData.username || !formData.password || !formData.name) {
        alert("Vui lòng điền đầy đủ các trường bắt buộc!");
        return;
      }

      // Call API to create user
      const response = await api.createUser({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role as "STUDENT" | "TEACHER" | "ADMIN",
        email: formData.email || undefined,
      });

      // Update state with new user from backend
      if (response.data) {
        setUsers((prevUsers) => [...prevUsers, response.data!]);
      }

      // Reset form and close dialog
      setFormData({
        username: "",
        password: "",
        name: "",
        role: "STUDENT",
        email: "",
      });
      setShowAddDialog(false);

      alert("Thêm người dùng thành công!");
    } catch (error: any) {
      console.error("Error adding user:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại!";
      alert(errorMessage);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email || "",
      role: user.role,
      password: "",
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      if (!editFormData.name) {
        alert("Vui lòng điền họ tên!");
        return;
      }

      const updateData: any = {
        name: editFormData.name,
        email: editFormData.email || undefined,
        role: editFormData.role as "STUDENT" | "TEACHER" | "ADMIN",
      };

      // Only include password if it's provided
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      await api.updateUser(selectedUser.id, updateData);

      // Update user in list
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                ...updateData,
              }
            : u
        )
      );

      setShowEditDialog(false);
      setSelectedUser(null);
      alert("Cập nhật người dùng thành công!");
    } catch (error: any) {
      console.error("Error updating user:", error);
      alert(
        error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại!"
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      return;
    }

    try {
      // Call API to delete user from database
      await api.deleteUser(userId);

      // Update state immediately - remove user from list
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));

      alert("Xóa người dùng thành công!");
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.message
          : "Có lỗi xảy ra. Vui lòng thử lại!";
      alert(errorMessage || "Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === "STUDENT").length,
    teachers: users.filter((u) => u.role === "TEACHER").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="eiu-gradient-primary text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <UsersIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Quản lý tài khoản</h1>
        </div>
        <p className="text-blue-100 ml-11">
          Quản lý toàn bộ người dùng trong hệ thống
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/import")}
          className="border-[#112444] text-[#112444] hover:bg-[#112444] hover:text-white smooth-transition"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Import từ Excel
        </Button>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#112444] hover:bg-[#1a365d] smooth-transition">
              <PlusCircle className="h-4 w-4 mr-2" />
              Thêm tài khoản mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm tài khoản mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="Nhập username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="password">
                  Mật khẩu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="name">
                  Họ tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nhập họ tên"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="role">
                  Vai trò <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Học sinh</SelectItem>
                    <SelectItem value="TEACHER">Giáo viên</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddUser}
                  className="flex-1 bg-[#112444] hover:bg-[#1a365d]"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Thêm tài khoản
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={selectedUser?.username || ""}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Username không thể thay đổi
                </p>
              </div>
              <div>
                <Label htmlFor="edit-name">
                  Họ tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Nhập họ tên"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Nhập email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-role">
                  Vai trò <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Học sinh</SelectItem>
                    <SelectItem value="TEACHER">Giáo viên</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-password">
                  Mật khẩu mới{" "}
                  <span className="text-gray-400 text-xs">
                    - Để trống nếu không đổi
                  </span>
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Nhập mật khẩu mới (tùy chọn)"
                  value={editFormData.password}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      password: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdateUser}
                  className="flex-1 bg-[#112444] hover:bg-[#1a365d]"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Cập nhật
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-500 rounded-lg">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-gray-600 font-medium">Tổng số</div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-blue-700 font-medium">Học sinh</div>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.students}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-purple-700 font-medium">
                Giáo viên
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.teachers}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card card-hover-lift border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm text-red-700 font-medium">Quản trị</div>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {stats.admins}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus:ring-2 focus:ring-[#112444]"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="focus:ring-2 focus:ring-[#112444]">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="student">Học sinh</SelectItem>
                <SelectItem value="teacher">Giáo viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <CardTitle className="text-[#112444]">
              Danh sách tài khoản ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#112444] text-white">
                    <th className="text-left py-4 px-4 font-semibold min-w-[120px]">
                      Username
                    </th>
                    <th className="text-left py-4 px-4 font-semibold min-w-[150px]">
                      Họ tên
                    </th>
                    <th className="text-left py-4 px-4 font-semibold min-w-[110px]">
                      Vai trò
                    </th>
                    <th className="text-left py-4 px-4 font-semibold min-w-[180px]">
                      Email
                    </th>
                    <th className="text-left py-4 px-4 font-semibold min-w-[150px]">
                      Lớp học
                    </th>
                    <th className="text-left py-4 px-4 font-semibold min-w-[110px]">
                      Ngày tạo
                    </th>
                    <th className="text-left py-4 px-4 font-semibold min-w-[120px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, index) => (
                    <tr
                      key={u.id}
                      className={`table-row-hover border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {u.username}
                      </td>
                      <td className="py-3 px-4 text-gray-800">{u.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getRoleBadge(u.role)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {u.email || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const allCourses = getUserCourses(u);
                          return allCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {allCourses.map((course, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                                  title={course.name || course.code}
                                >
                                  {course.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(u)}
                            title="Chỉnh sửa"
                            className="hover:bg-[#112444] hover:text-white hover:border-[#112444] smooth-transition"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            title="Xóa"
                            className="hover:bg-red-600 hover:text-white hover:border-red-600 smooth-transition"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 hover:text-white" />
                          </Button>
                        </div>
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
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Không tìm thấy người dùng
              </h3>
              <p className="text-gray-500">
                {searchQuery || roleFilter !== "all"
                  ? "Không tìm thấy người dùng phù hợp với bộ lọc"
                  : "Chưa có người dùng nào trong hệ thống"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
