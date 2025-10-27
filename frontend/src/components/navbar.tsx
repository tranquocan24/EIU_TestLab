'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Home, FileText, BarChart, PlusCircle, Menu, X } from 'lucide-react'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getNavigationLinks = () => {
    if (!user) return []

    const role = user.role.toLowerCase()

    switch (role) {
      case 'student':
        return [
          { href: '/student', label: 'Trang chủ', icon: Home },
          { href: '/student/exams', label: 'Danh sách bài thi', icon: FileText },
          { href: '/student/results', label: 'Kết quả của tôi', icon: BarChart },
        ]
      case 'teacher':
        return [
          { href: '/teacher', label: 'Trang chủ', icon: Home },
          { href: '/teacher/exams', label: 'Quản lý đề thi', icon: FileText },
          { href: '/teacher/create', label: 'Tạo đề thi', icon: PlusCircle },
          { href: '/teacher/results', label: 'Xem kết quả', icon: BarChart },
        ]
      case 'admin':
        return [
          { href: '/admin', label: 'Trang chủ', icon: Home },
          { href: '/admin/users', label: 'Quản lý người dùng', icon: User },
          { href: '/admin/exams', label: 'Quản lý bài thi', icon: FileText },
          { href: '/admin/stats', label: 'Thống kê', icon: BarChart },
        ]
      default:
        return []
    }
  }

  const navigationLinks = getNavigationLinks()

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Desktop Navigation */}
          {isAuthenticated && navigationLinks.length > 0 && (
            <div className="hidden md:flex items-center space-x-1">
              {navigationLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#112444] text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-[#112444]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4 ml-auto">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-700">
                  Xin chào, <span className="font-semibold text-[#112444]">{user?.name || user?.username}</span>
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="border-gray-300 hover:bg-gray-100">
                      <User className="h-4 w-4" />
                      <span className="sr-only">User menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user?.name || user?.username}</span>
                        <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                {navigationLinks.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden border-gray-300 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" asChild className="border-gray-300 hover:bg-gray-100">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && mobileMenuOpen && navigationLinks.length > 0 && (
          <div className="md:hidden pb-4 space-y-1">
            {navigationLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#112444] text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}