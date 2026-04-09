import { apiClient } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'banned';
  roles: Role[];
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
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData) {
    return apiClient.post<LoginResponse>('/register', data);
  },

  async login(data: LoginData) {
    return apiClient.post<LoginResponse>('/login', data);
  },

  async logout() {
    return apiClient.post('/logout');
  },

  async me() {
    return apiClient.get<{ user: User }>('/me');
  },
};

export const tokenStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  },
};
