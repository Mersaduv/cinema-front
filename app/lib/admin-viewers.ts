import { apiClient, type ApiResponse } from "./api";

export interface AdminViewer {
  id: number;
  name: string;
  email: string;
  status: "active" | "banned";
  created_at: string | null;
}

export interface AdminStatusOption {
  value: "active" | "banned";
  label: string;
}

export interface AdminViewersSummary {
  total_viewers: number;
  active_viewers: number;
  banned_viewers: number;
}

export interface AdminViewersPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminViewersResponse {
  viewers: AdminViewer[];
  statuses: AdminStatusOption[];
  summary: AdminViewersSummary;
  pagination: AdminViewersPagination;
}

export interface CreateAdminViewerPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  status: "active" | "banned";
}

export const adminViewersService = {
  async list(params: {
    search?: string;
    status?: string;
    page?: number;
  }): Promise<ApiResponse<AdminViewersResponse>> {
    const query = new URLSearchParams();

    if (params.search) {
      query.set("search", params.search);
    }
    if (params.status) {
      query.set("status", params.status);
    }
    if (params.page) {
      query.set("page", String(params.page));
    }

    const endpoint = `/admin/viewers${query.toString() ? `?${query.toString()}` : ""}`;

    return apiClient.get<AdminViewersResponse>(endpoint);
  },

  async create(payload: CreateAdminViewerPayload) {
    return apiClient.post<{ viewer: AdminViewer }>("/admin/viewers", payload);
  },

  async updateStatus(viewerId: number, status: "active" | "banned") {
    return apiClient.put<{ viewer: AdminViewer }>(
      `/admin/viewers/${viewerId}/status`,
      { status },
    );
  },
};
