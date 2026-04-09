"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string | string[];
  requirePermission?: string | string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  requirePermission,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requireRole) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
      const hasRequiredRole = roles.some((role) => hasRole(role));
      
      if (!hasRequiredRole) {
        router.push('/');
        return;
      }
    }

    if (requirePermission) {
      const permissions = Array.isArray(requirePermission)
        ? requirePermission
        : [requirePermission];
      const hasRequiredPermission = permissions.some((permission) =>
        hasPermission(permission)
      );

      if (!hasRequiredPermission) {
        router.push('/');
        return;
      }
    }
  }, [
    loading,
    isAuthenticated,
    requireAuth,
    requireRole,
    requirePermission,
    hasRole,
    hasPermission,
    router,
    redirectTo,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f5c518]"></div>
          <p className="mt-4 text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasRequiredRole = roles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return null;
    }
  }

  if (requirePermission) {
    const permissions = Array.isArray(requirePermission)
      ? requirePermission
      : [requirePermission];
    const hasRequiredPermission = permissions.some((permission) =>
      hasPermission(permission)
    );
    if (!hasRequiredPermission) {
      return null;
    }
  }

  return <>{children}</>;
}
