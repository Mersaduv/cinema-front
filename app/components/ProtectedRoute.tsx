"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requireRole?: string | string[];
  requirePermission?: string | string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  fallback = null,
  requireAuth = true,
  requireRole,
  requirePermission,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, hasToken, authReady, hasRole, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const loginRedirect =
    redirectTo === "/login" && pathname
      ? `/login?redirect=${encodeURIComponent(pathname)}`
      : redirectTo;

  useEffect(() => {
    if (!authReady || loading) return;

    if (requireAuth && !hasToken) {
      router.push(loginRedirect);
      return;
    }

    if (requireAuth && hasToken && !isAuthenticated) {
      router.push(loginRedirect);
      return;
    }

    if (requireRole) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
      const hasRequiredRole = roles.some((role) => hasRole(role));

      if (!hasRequiredRole) {
        router.push("/");
        return;
      }
    }

    if (requirePermission) {
      const permissions = Array.isArray(requirePermission)
        ? requirePermission
        : [requirePermission];
      const hasRequiredPermission = permissions.some((permission) =>
        hasPermission(permission),
      );

      if (!hasRequiredPermission) {
        router.push("/");
        return;
      }
    }
  }, [
    authReady,
    loading,
    hasToken,
    isAuthenticated,
    requireAuth,
    requireRole,
    requirePermission,
    hasRole,
    hasPermission,
    router,
    loginRedirect,
  ]);

  if (!authReady && requireAuth) {
    return <>{fallback}</>;
  }

  if (!authReady) {
    return <>{children}</>;
  }

  if (loading && requireAuth && hasToken && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requireAuth && !hasToken) {
    return <>{fallback}</>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
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
      hasPermission(permission),
    );
    if (!hasRequiredPermission) {
      return null;
    }
  }

  return <>{children}</>;
}
