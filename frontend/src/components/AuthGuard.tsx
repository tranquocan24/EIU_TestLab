"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  allowedRoles,
  requireAuth = true,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand store to hydrate from localStorage
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Skip auth check if not required
    if (!requireAuth) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role.toLowerCase();
      const hasAccess = allowedRoles.some(
        (role) => role.toLowerCase() === userRole
      );

      if (!hasAccess) {
        // Redirect based on user role
        switch (userRole) {
          case "admin":
            router.push("/admin");
            break;
          case "teacher":
            router.push("/teacher");
            break;
          case "student":
            router.push("/student");
            break;
          default:
            router.push("/login");
        }
      }
    }
  }, [
    isHydrated,
    isAuthenticated,
    user,
    allowedRoles,
    requireAuth,
    router,
    pathname,
  ]);

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444]"></div>
      </div>
    );
  }

  // Show loading while checking auth
  if (requireAuth && (!isAuthenticated || !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#112444]"></div>
      </div>
    );
  }

  // Render children if authorized
  return <>{children}</>;
}
