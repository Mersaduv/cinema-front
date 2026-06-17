"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, tokenStorage, User } from '../lib/auth';
import { migrateAnonymousWatchProgress } from '../lib/watchProgressMigration';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await authService.me();

        if (response.success && response.data?.user) {
          setUser(response.data.user);
          void migrateAnonymousWatchProgress(String(response.data.user.id));
          return;
        }

        const status = response.status ?? 0;
        if (status === 401 || status === 403) {
          tokenStorage.removeToken();
          setUser(null);
          return;
        }

        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 400));
        }
      }
    } catch {
      // Keep token on transient network errors; session may still be valid.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.data) {
        tokenStorage.setToken(response.data.token);
        setUser(response.data.user);
        void migrateAnonymousWatchProgress(String(response.data.user.id));
        return { success: true };
      } else {
        return {
          success: false,
          message:
            response.message === "Invalid credentials"
              ? "ایمیل یا رمز عبور اشتباه است."
              : response.message || "ورود ناموفق بود. لطفا دوباره تلاش کنید.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
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
        setUser(response.data.user);
        void migrateAnonymousWatchProgress(String(response.data.user.id));
        return { success: true };
      } else {
        return {
          success: false,
          message: response.message || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.removeToken();
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.slug === role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.roles.some((role) =>
      role.permissions?.some((p) => p.slug === permission)
    );
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
