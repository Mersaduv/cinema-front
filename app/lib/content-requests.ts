import { apiClient, type ApiResponse } from "./api";

export const CONTENT_REQUEST_TITLE_MIN = 2;
export const CONTENT_REQUEST_TITLE_MAX = 200;
export const CONTENT_REQUEST_DESCRIPTION_MIN = 10;
export const CONTENT_REQUEST_DESCRIPTION_MAX = 2000;

export type ContentRequestStatus =
  | "pending"
  | "in_progress"
  | "fulfilled"
  | "rejected";

export type ContentRequest = {
  id: number;
  title: string;
  genre_slug: string;
  genre_name: string;
  description: string;
  status: ContentRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at?: string;
  moderated_at?: string | null;
  is_own?: boolean;
};

export type ContentRequestsPayload = {
  requests: ContentRequest[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export const contentRequestStatusLabels: Record<ContentRequestStatus, string> = {
  pending: "در انتظار بررسی",
  in_progress: "در حال پیگیری",
  fulfilled: "انجام شد",
  rejected: "رد شده",
};

function mapContentRequest(row: Record<string, unknown>): ContentRequest {
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    genre_slug: String(row.genre_slug ?? ""),
    genre_name: String(row.genre_name ?? ""),
    description: String(row.description ?? ""),
    status: (row.status as ContentRequestStatus) ?? "pending",
    admin_note: (row.admin_note as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    moderated_at: (row.moderated_at as string | null) ?? null,
    is_own: Boolean(row.is_own),
  };
}

export function validateContentRequestForm(input: {
  title: string;
  genreSlug: string;
  description: string;
}): string | null {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length < CONTENT_REQUEST_TITLE_MIN) {
    return "نام فیلم یا سریال را وارد کنید.";
  }

  if (title.length > CONTENT_REQUEST_TITLE_MAX) {
    return "نام فیلم یا سریال خیلی طولانی است.";
  }

  if (!input.genreSlug) {
    return "ژانر را انتخاب کنید.";
  }

  if (description.length < CONTENT_REQUEST_DESCRIPTION_MIN) {
    return `توضیحات باید حداقل ${CONTENT_REQUEST_DESCRIPTION_MIN} کاراکتر باشد.`;
  }

  if (description.length > CONTENT_REQUEST_DESCRIPTION_MAX) {
    return "توضیحات خیلی طولانی است.";
  }

  return null;
}

export async function fetchUserContentRequests(
  page = 1,
  perPage = 20,
  status?: ContentRequestStatus,
): Promise<ApiResponse<ContentRequestsPayload>> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("per_page", String(perPage));
  if (status) {
    query.set("status", status);
  }

  const response = await apiClient.get<{
    requests: Record<string, unknown>[];
    pagination: ContentRequestsPayload["pagination"];
  }>(`/requests?${query.toString()}`);

  if (!response.success || !response.data) {
    return response as ApiResponse<ContentRequestsPayload>;
  }

  return {
    ...response,
    data: {
      requests: response.data.requests.map(mapContentRequest),
      pagination: response.data.pagination,
    },
  };
}

export async function submitContentRequest(input: {
  title: string;
  genreSlug: string;
  description: string;
}): Promise<ApiResponse<{ request: ContentRequest }>> {
  const response = await apiClient.post<{
    request: Record<string, unknown>;
  }>("/requests", {
    title: input.title.trim(),
    genre_slug: input.genreSlug,
    description: input.description.trim(),
  });

  if (!response.success || !response.data?.request) {
    return response as ApiResponse<{ request: ContentRequest }>;
  }

  return {
    ...response,
    data: {
      request: mapContentRequest(response.data.request),
    },
  };
}
