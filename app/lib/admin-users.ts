import { apiClient, type ApiResponse } from "./api";
import type { Role } from "./auth";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: "active" | "banned";
  created_at: string | null;
  roles: Role[];
}

export interface AdminRoleOption {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permission_slugs?: string[];
}

export interface AdminPermissionTreeItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
}

export interface AdminPermissionTreeGroup {
  id: string;
  label: string;
  permissions: AdminPermissionTreeItem[];
}

export interface AdminStatusOption {
  value: "active" | "banned";
  label: string;
}

export interface AdminUsersSummary {
  total_users: number;
  active_users: number;
  admins: number;
  media_users?: number;
  support_users: number;
}

export interface AdminUsersPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  roles: AdminRoleOption[];
  statuses: AdminStatusOption[];
  summary: AdminUsersSummary;
  pagination: AdminUsersPagination;
}

export interface AdminUserOptionsResponse {
  roles: AdminRoleOption[];
  statuses: AdminStatusOption[];
  permission_tree: AdminPermissionTreeGroup[];
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role_slug: string;
  permission_slugs: string[];
  status: "active" | "banned";
}

export const adminUsersService = {
  async list(params: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
  }): Promise<ApiResponse<AdminUsersResponse>> {
    const query = new URLSearchParams();

    if (params.search) {
      query.set("search", params.search);
    }
    if (params.role) {
      query.set("role", params.role);
    }
    if (params.status) {
      query.set("status", params.status);
    }
    if (params.page) {
      query.set("page", String(params.page));
    }

    const endpoint = `/admin/users${query.toString() ? `?${query.toString()}` : ""}`;

    return apiClient.get<AdminUsersResponse>(endpoint);
  },

  async options(): Promise<ApiResponse<AdminUserOptionsResponse>> {
    return apiClient.get<AdminUserOptionsResponse>("/admin/users/options");
  },

  async create(payload: CreateAdminUserPayload) {
    return apiClient.post<{ user: AdminUser }>("/admin/users", payload);
  },
};
