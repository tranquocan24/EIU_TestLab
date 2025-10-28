'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PlusCircle, Search, Edit, Trash2, UserPlus } from 'lucide-react'
import api from '@/lib/api'

interface User {
    id: string
    username: string
    name: string
    role: 'STUDENT' | 'TEACHER' | 'ADMIN'
    email?: string
    createdAt: string
}

export default function ManageUsersPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [showAddDialog, setShowAddDialog] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'STUDENT',
        email: ''
    })

    useEffect(() => {
        if (!isAuthenticated || user?.role.toLowerCase() !== 'admin') {
            router.push('/login')
            return
        }

        loadUsers()
    }, [isAuthenticated, user, router])

    useEffect(() => {
        filterUsers()
    }, [users, searchQuery, roleFilter])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const users = await api.getUsers()
            setUsers(users || [])
        } catch (error) {
            console.error('Error loading users:', error)
            alert('Không thể tải danh sách người dùng!')
        } finally {
            setLoading(false)
        }
    }

    const filterUsers = () => {
        let filtered = [...users]

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(u =>
                u.username.toLowerCase().includes(query) ||
                u.name.toLowerCase().includes(query) ||
                (u.email && u.email.toLowerCase().includes(query))
            )
        }

        // Apply role filter
        if (roleFilter && roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter.toUpperCase())
        }

        setFilteredUsers(filtered)
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'STUDENT':
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Học sinh</span>
            case 'TEACHER':
                return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Giáo viên</span>
            case 'ADMIN':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Quản trị</span>
            default:
                return null
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN')
    }

    const handleAddUser = async () => {
        try {
            // Validate required fields
            if (!formData.username || !formData.password || !formData.name) {
                alert('Vui lòng điền đầy đủ các trường bắt buộc!')
                return
            }

            // Call API to create user
            const response = await api.createUser({
                username: formData.username,
                password: formData.password,
                name: formData.name,
                role: formData.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
                email: formData.email || undefined,
            })

            // Update state with new user from backend
            if (response.data) {
                setUsers(prevUsers => [...prevUsers, response.data!])
            }

            // Reset form and close dialog
            setFormData({
                username: '',
                password: '',
                name: '',
                role: 'STUDENT',
                email: ''
            })
            setShowAddDialog(false)
            
            alert('Thêm người dùng thành công!')
        } catch (error: any) {
            console.error('Error adding user:', error)
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!'
            alert(errorMessage)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            return
        }

        try {
            // Call API to delete user from database
            await api.deleteUser(userId)

            // Update state immediately - remove user from list
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId))
            
            alert('Xóa người dùng thành công!')
        } catch (error: unknown) {
            console.error('Error deleting user:', error)
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as any).response?.data?.message 
                : 'Có lỗi xảy ra. Vui lòng thử lại!'
            alert(errorMessage || 'Có lỗi xảy ra. Vui lòng thử lại!')
        }
    }

    const stats = {
        total: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        teachers: users.filter(u => u.role === 'TEACHER').length,
        admins: users.filter(u => u.role === 'ADMIN').length
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải danh sách người dùng...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeInUp">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button>
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
                                <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                                <Input
                                    id="username"
                                    placeholder="Nhập username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Nhập mật khẩu"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Họ tên <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="Nhập họ tên"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Nhập email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="role">Vai trò <span className="text-red-500">*</span></Label>
                                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
                                <Button onClick={handleAddUser} className="flex-1">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Thêm tài khoản
                                </Button>
                                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-gray-500">
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Tổng số</div>
                        <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Học sinh</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Giáo viên</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.teachers}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Quản trị</div>
                        <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm theo tên hoặc username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách tài khoản ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Họ tên</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Vai trò</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày tạo</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-gray-800 font-medium">{u.username}</td>
                                            <td className="py-3 px-4 text-gray-800">{u.name}</td>
                                            <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                                            <td className="py-3 px-4 text-gray-600">{u.email || '-'}</td>
                                            <td className="py-3 px-4 text-gray-600">{formatDate(u.createdAt)}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleDeleteUser(u.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-600" />
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
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy người dùng</h3>
                            <p className="text-gray-500">
                                {searchQuery || roleFilter !== 'all'
                                    ? 'Không tìm thấy người dùng phù hợp với bộ lọc'
                                    : 'Chưa có người dùng nào trong hệ thống'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
