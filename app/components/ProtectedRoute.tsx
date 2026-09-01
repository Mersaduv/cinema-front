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
  /** Restrict to viewer accounts (audience features / profile). */
  requireViewer?: boolean;
  /** Restrict to staff accounts (panel users). */
  requireStaff?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  fallback = null,
  requireAuth = true,
  requireRole,
  requirePermission,
  requireViewer = false,
  requireStaff = false,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const {
    loading,
    isAuthenticated,
    hasToken,
    authReady,
    hasRole,
    hasPermission,
    isViewer,
    isStaff,
  } = useAuth();
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

    if (requireViewer && isAuthenticated && !isViewer) {
      router.push(isStaff ? "/admin" : "/");
      return;
    }

    if (requireStaff && isAuthenticated && !isStaff) {
      router.push("/");
      return;
    }

    if (requireRole) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
      const hasRequiredRole = roles.some((role) => hasRole(role));

      if (!hasRequiredRole) {
        router.push(isStaff ? "/adminbod" : "/");
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
    isViewer,
    isStaff,
    requireAuth,
    requireViewer,
    requireStaff,
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

  if (requireViewer && !isViewer) {
    return null;
  }

  if (requireStaff && !isStaff) {
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
      hasPermission(permission),
    );
    if (!hasRequiredPermission) {
      return null;
    }
  }

  return <>{children}</>;
}
