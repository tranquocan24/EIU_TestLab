'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const CURRENT_VERSION = '2.0';

export function VersionMismatchBanner() {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Check version mismatch
  if (typeof window === 'undefined' || !isAuthenticated) return null;

  const storedVersion = localStorage.getItem('storage-version');
  if (!storedVersion || storedVersion === CURRENT_VERSION) return null;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Alert variant="destructive" className="max-w-4xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Cập nhật hệ thống</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Hệ thống đã được cập nhật. Vui lòng đăng xuất và đăng nhập lại để tiếp tục sử dụng.
          </span>
          <Button onClick={handleLogout} variant="outline" size="sm" className="ml-4">
            Đăng xuất ngay
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
