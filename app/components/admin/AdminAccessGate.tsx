"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

const ADMIN_PANEL_ROLES = ["admin", "media", "support"] as const;

interface AdminAccessGateProps {
  children: ReactNode;
}

export default function AdminAccessGate({ children }: AdminAccessGateProps) {
  const router = useRouter();
  const {
    authReady,
    loading,
    hasToken,
    isAuthenticated,
    isStaff,
    hasRole,
  } = useAuth();

  const hasPanelRole = ADMIN_PANEL_ROLES.some((role) => hasRole(role));
  const canAccess = hasToken && isAuthenticated && isStaff && hasPanelRole;

  useEffect(() => {
    if (!authReady || loading || (hasToken && !isAuthenticated)) {
      return;
    }

    if (!canAccess) {
      router.replace("/adminbod");
    }
  }, [authReady, loading, hasToken, isAuthenticated, canAccess, router]);

  if (!authReady) {
    return null;
  }

  if (loading || (hasToken && !isAuthenticated)) {
    return null;
  }

  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
}
