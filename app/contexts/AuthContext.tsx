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
import { authService, tokenStorage, User } from "../lib/auth";
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
  /** Synchronous token presence — available immediately on mount. */
  hasToken: boolean;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  login: (
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
  hasToken: false,
  isAuthenticated: false,
  isRefreshing: false,
  login: async () => ({ success: false, message: "Auth unavailable" }),
  register: async () => ({ success: false, message: "Auth unavailable" }),
  logout: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  refreshUser: async () => {},
};

function readHasToken(): boolean {
  return Boolean(tokenStorage.getToken());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(readHasToken);

  const [user, setUser] = useState<User | null>(() => peekCachedSessionUser());
  const [loading, setLoading] = useState(
    () => Boolean(tokenStorage.getToken()) && !peekCachedSessionUser(),
  );
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
          void migrateAnonymousWatchProgress(String(result.user.id));
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
    const token = tokenStorage.getToken();
    setHasToken(Boolean(token));
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cached = peekCachedSessionUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    let cancelled = false;

    void (async () => {
      const needsPermissions =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin");

      const result = await fetchCurrentSession({
        includePermissions: needsPermissions,
      });

      if (cancelled) {
        return;
      }

      if (result.user) {
        setUser(result.user);
        void migrateAnonymousWatchProgress(String(result.user.id));
      } else if (result.status === 401 || result.status === 403) {
        setUser(null);
        setHasToken(false);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.data) {
        tokenStorage.setToken(response.data.token);
        setHasToken(true);
        primeSessionUser(response.data.user);
        setUser(response.data.user);
        setLoading(false);
        void migrateAnonymousWatchProgress(String(response.data.user.id));
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
        void migrateAnonymousWatchProgress(String(response.data.user.id));
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
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      invalidateSession();
      setHasToken(false);
      setUser(null);
      setLoading(false);
      router.push("/login");
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
      return user.roles.some((role) =>
        role.permissions?.some((p) => p.slug === permission),
      );
    },
    [user],
  );

  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      hasToken,
      isAuthenticated: Boolean(user),
      isRefreshing,
      login,
      register,
      logout,
      hasRole,
      hasPermission,
      refreshUser,
    }),
    [
      user,
      loading,
      hasToken,
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
