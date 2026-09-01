"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  authService,
  isStaffAccount,
  isViewerAccount,
  tokenStorage,
  User,
} from "../lib/auth";
import { migrateAnonymousWatchProgress } from "../lib/watchProgressMigration";
import {
  fetchCurrentSession,
  invalidateSession,
  peekCachedSessionUser,
  primeSessionUser,
} from "../lib/session-service";

interface AuthContextType {
  user: User | null;
  /** True only while verifying a stored token with no cached user snapshot. */
  loading: boolean;
  /** False until client has read localStorage — keeps SSR/hydration markup stable. */
  authReady: boolean;
  /** Token presence after client hydration. */
  hasToken: boolean;
  isAuthenticated: boolean;
  isViewer: boolean;
  isStaff: boolean;
  isRefreshing: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  staffLogin: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: (options?: { includePermissions?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAuthContext: AuthContextType = {
  user: null,
  loading: false,
  authReady: false,
  hasToken: false,
  isAuthenticated: false,
  isViewer: false,
  isStaff: false,
  isRefreshing: false,
  login: async () => ({ success: false, message: "Auth unavailable" }),
  staffLogin: async () => ({ success: false, message: "Auth unavailable" }),
  register: async () => ({ success: false, message: "Auth unavailable" }),
  logout: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  refreshUser: async () => {},
};

function readHasToken(): boolean {
  return Boolean(tokenStorage.getToken());
}

function maybeMigrateWatchProgress(user: User) {
  if (isViewerAccount(user)) {
    void migrateAnonymousWatchProgress(String(user.id));
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = useCallback(
    async (options?: { includePermissions?: boolean }) => {
      const token = tokenStorage.getToken();
      setHasToken(Boolean(token));
      if (!token) {
        setUser(null);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const hadUser = Boolean(peekCachedSessionUser());
      if (!hadUser) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const result = await fetchCurrentSession({
          force: true,
          includePermissions: options?.includePermissions,
        });

        if (result.user) {
          setUser(result.user);
          maybeMigrateWatchProgress(result.user);
        } else if (result.status === 401 || result.status === 403) {
          setUser(null);
          setHasToken(false);
        }
      } catch {
        // Keep cached user on transient network errors.
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === "auth_token") {
        setHasToken(readHasToken());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = tokenStorage.getToken();
      setHasToken(Boolean(token));

      if (!token) {
        setUser(null);
        setLoading(false);
        setAuthReady(true);
        return;
      }

      const cached = peekCachedSessionUser();
      if (cached) {
        setUser(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      setAuthReady(true);

      const path = window.location.pathname;
      const needsPermissions =
        path === "/admin" ||
        path.startsWith("/admin/") ||
        path.startsWith("/adminbod");
      const result = await fetchCurrentSession({
        includePermissions: needsPermissions,
      });

      if (cancelled) {
        return;
      }

      if (result.user) {
        setUser(result.user);
        maybeMigrateWatchProgress(result.user);
      } else if (result.status === 401 || result.status === 403) {
        setUser(null);
        setHasToken(false);
      }

      setLoading(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.data) {
        tokenStorage.setToken(response.data.token);
        setHasToken(true);
        primeSessionUser(response.data.user);
        setUser(response.data.user);
        setLoading(false);
        maybeMigrateWatchProgress(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        message:
          response.message === "Invalid credentials"
            ? "ایمیل یا رمز عبور اشتباه است."
            : response.message || "ورود ناموفق بود. لطفا دوباره تلاش کنید.",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const staffLogin = async (email: string, password: string) => {
    try {
      const response = await authService.staffLogin({ email, password });
      if (response.success && response.data) {
        tokenStorage.setToken(response.data.token);
        setHasToken(true);
        primeSessionUser(response.data.user);
        setUser(response.data.user);
        setLoading(false);
        return { success: true };
      }

      return {
        success: false,
        message:
          response.message === "Invalid credentials"
            ? "ایمیل یا رمز عبور اشتباه است."
            : response.message || "ورود ناموفق بود. لطفا دوباره تلاش کنید.",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => {
    try {
      const response = await authService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      if (response.success && response.data) {
        tokenStorage.setToken(response.data.token);
        setHasToken(true);
        primeSessionUser(response.data.user);
        setUser(response.data.user);
        setLoading(false);
        maybeMigrateWatchProgress(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        message: response.message || "Registration failed",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed",
      };
    }
  };

  const logout = async () => {
    const wasStaff = isStaffAccount(user);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      invalidateSession();
      setHasToken(false);
      setUser(null);
      setLoading(false);
      router.push(wasStaff ? "/adminbod" : "/login");
    }
  };

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) {
        return false;
      }
      return user.roles.some((r) => r.slug === role);
    },
    [user],
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) {
        return false;
      }

      if (user.permissions && user.permissions.length > 0) {
        return user.permissions.some((item) => item.slug === permission);
      }

      return user.roles.some((role) =>
        role.permissions?.some((item) => item.slug === permission),
      );
    },
    [user],
  );

  const isViewer = isViewerAccount(user);
  const isStaff = isStaffAccount(user);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      authReady,
      hasToken,
      isAuthenticated: Boolean(user),
      isViewer,
      isStaff,
      isRefreshing,
      login,
      staffLogin,
      register,
      logout,
      hasRole,
      hasPermission,
      refreshUser,
    }),
    [
      user,
      loading,
      authReady,
      hasToken,
      isViewer,
      isStaff,
      isRefreshing,
      hasRole,
      hasPermission,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/** Safe for public pages when auth context is unavailable in a split bundle. */
export function useOptionalAuth(): AuthContextType {
  return useContext(AuthContext) ?? defaultAuthContext;
}
