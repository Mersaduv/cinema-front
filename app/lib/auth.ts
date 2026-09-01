import { apiClient } from './api';
import { tokenStorage } from './token-storage';

export { tokenStorage };

export type AccountType = 'viewer' | 'staff';

export interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'banned';
  account_type?: AccountType;
  roles: Role[];
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  captcha_token?: string;
}

export interface LoginData {
  email: string;
  password: string;
  captcha_token?: string;
}

export function isViewerAccount(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (user.account_type === 'viewer') {
    return true;
  }

  if (user.account_type === 'staff') {
    return false;
  }

  // Legacy tokens without account_type: treat role-bearing users as staff.
  return !user.roles?.some((role) =>
    ['admin', 'support', 'super-admin'].includes(role.slug),
  );
}

export function isStaffAccount(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (user.account_type === 'staff') {
    return true;
  }

  if (user.account_type === 'viewer') {
    return false;
  }

  return user.roles?.some((role) =>
    ['admin', 'support', 'super-admin'].includes(role.slug),
  );
}

export const authService = {
  async register(data: RegisterData) {
    return apiClient.post<LoginResponse>('/register', data);
  },

  async login(data: LoginData) {
    return apiClient.post<LoginResponse>('/login', data);
  },

  async staffLogin(data: LoginData) {
    return apiClient.post<LoginResponse>('/staff/login', data);
  },

  async logout() {
    return apiClient.post('/logout');
  },

  async me(options?: { includePermissions?: boolean }) {
    const query =
      options?.includePermissions === true ? "?include_permissions=1" : "";
    return apiClient.get<{ user: User }>(`/me${query}`);
  },
};
