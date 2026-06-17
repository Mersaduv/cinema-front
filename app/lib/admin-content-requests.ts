import { adminApiErrorMessage, unwrapAdminListPayload } from "./admin-api";
import { apiClient, type ApiResponse } from "./api";
import type { ContentRequest, ContentRequestsPayload } from "./content-requests";

export type AdminContentRequest = ContentRequest & {
  user?: { id: number; name: string; email: string } | null;
};

function mapAdminContentRequest(row: Record<string, unknown>): AdminContentRequest {
  const user = (row.user as Record<string, unknown> | null) ?? null;

  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    genre_slug: String(row.genre_slug ?? ""),
    genre_name: String(row.genre_name ?? ""),
    description: String(row.description ?? ""),
    status: (row.status as AdminContentRequest["status"]) ?? "pending",
    admin_note: (row.admin_note as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    moderated_at: (row.moderated_at as string | null) ?? null,
    user: user
      ? {
          id: Number(user.id),
          name: String(user.name ?? ""),
          email: String(user.email ?? ""),
        }
      : null,
  };
}

function unwrapSingleRequest(
  response: ApiResponse<{ request: AdminContentRequest }>,
): AdminContentRequest | null {
  const raw =
    (response.data as { request?: Record<string, unknown> } | undefined)?.request ??
    ((response as { request?: Record<string, unknown> }).request ?? null);

  return raw ? mapAdminContentRequest(raw) : null;
}

export async function fetchAdminContentRequests(params?: {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
}): Promise<ContentRequestsPayload & { requests: AdminContentRequest[] }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.perPage) query.set("per_page", String(params.perPage));
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await apiClient.get<
    ContentRequestsPayload & { requests: AdminContentRequest[] }
  >(`/admin/requests${suffix}`);

  const payload = unwrapAdminListPayload<
    ContentRequestsPayload & { requests: AdminContentRequest[] }
  >(response, "requests");

  if (!payload) {
    throw new Error(adminApiErrorMessage(response, "دریافت درخواست‌ها با خطا روبه‌رو شد."));
  }

  return {
    requests: (payload.requests ?? []).map((row) =>
      mapAdminContentRequest(row as unknown as Record<string, unknown>),
    ),
    pagination: payload.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    },
  };
}

export async function updateAdminContentRequest(
  id: number,
  payload: { status?: string; admin_note?: string | null },
): Promise<ApiResponse<{ request: AdminContentRequest }>> {
  const response = await apiClient.put<{ request: AdminContentRequest }>(
    `/admin/requests/${id}`,
    payload,
  );
  const request = unwrapSingleRequest(response);

  if (!response.success) {
    return response;
  }

  if (!request) {
    return {
      success: false,
      message: "پاسخ سرور نامعتبر بود.",
    };
  }

  return {
    ...response,
    data: { request },
  };
}
