"use client";

import type { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { hasAnyPermission } from "../../lib/admin-permissions";

interface AdminPermissionGateProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminPermissionGate({
  permission,
  children,
  fallback = null,
}: AdminPermissionGateProps) {
  const { hasPermission } = useAuth();

  if (!hasAnyPermission(hasPermission, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
