import { apiClient } from "./api";
import { adminApiErrorMessage } from "./admin-api";

export type AdminDashboardSummary = {
  movies: {
    total: number;
    drafts: number;
    published: number;
    processing: number;
    ready: number;
  };
  series: {
    total: number;
    drafts: number;
    scheduled: number;
    published: number;
    featured: number;
  };
  collections: number;
  users: number;
  reviews_pending: number;
  tickets_waiting: number;
  requests_pending: number;
};

export async function fetchAdminDashboardSummary(): Promise<{
  data: AdminDashboardSummary | null;
  error: string | null;
}> {
  const response = await apiClient.get<AdminDashboardSummary>("/admin/dashboard/summary");

  if (!response.success || !response.data) {
    return {
      data: null,
      error: adminApiErrorMessage(response, "بارگذاری داشبورد انجام نشد."),
    };
  }

  return { data: response.data, error: null };
}
