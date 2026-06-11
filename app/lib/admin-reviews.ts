import { adminApiErrorMessage, unwrapAdminListPayload } from "./admin-api";
import { apiClient, type ApiResponse } from "./api";
import type { ReviewStatus } from "./reviews";

export interface AdminReviewUser {
  id: number;
  name: string;
  email: string;
}

export interface AdminReview {
  id: number;
  reviewable_type: "movie" | "series";
  reviewable_id: number;
  content_title: string | null;
  content_slug: string | null;
  user: AdminReviewUser;
  rating: number;
  body: string | null;
  body_original: string | null;
  status: ReviewStatus;
  admin_note: string | null;
  is_approved: boolean;
  created_at: string;
  moderated_at: string | null;
}

export interface AdminReviewsPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminReviewsResponse {
  reviews: AdminReview[];
  pagination: AdminReviewsPagination;
}

function mapAdminReview(row: Record<string, unknown>): AdminReview {
  const user = (row.user as Record<string, unknown>) ?? {};

  return {
    id: Number(row.id),
    reviewable_type: row.reviewable_type as AdminReview["reviewable_type"],
    reviewable_id: Number(row.reviewable_id),
    content_title: (row.content_title as string | null) ?? null,
    content_slug: (row.content_slug as string | null) ?? null,
    user: {
      id: Number(user.id),
      name: String(user.name ?? ""),
      email: String(user.email ?? ""),
    },
    rating: Number(row.rating),
    body: (row.body as string | null) ?? null,
    body_original: (row.body_original as string | null) ?? null,
    status: (row.status as ReviewStatus) ?? "pending",
    admin_note: (row.admin_note as string | null) ?? null,
    is_approved: Boolean(row.is_approved),
    created_at: String(row.created_at ?? ""),
    moderated_at: (row.moderated_at as string | null) ?? null,
  };
}

export async function fetchAdminReviews(params: {
  page?: number;
  perPage?: number;
  status?: ReviewStatus | "";
  reviewableType?: "movie" | "series" | "";
  search?: string;
}): Promise<AdminReviewsResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("per_page", String(params.perPage ?? 20));
  if (params.status) query.set("status", params.status);
  if (params.reviewableType) query.set("reviewable_type", params.reviewableType);
  if (params.search) query.set("search", params.search);

  const response = await apiClient.get<AdminReviewsResponse>(
    `/admin/reviews?${query.toString()}`,
  );
  const payload = unwrapAdminListPayload<AdminReviewsResponse>(response, "reviews");

  if (!payload) {
    throw new Error(adminApiErrorMessage(response, "دریافت دیدگاه‌ها با خطا روبه‌رو شد."));
  }

  return {
    reviews: (payload.reviews ?? []).map((row) =>
      mapAdminReview(row as unknown as Record<string, unknown>),
    ),
    pagination: payload.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    },
  };
}

function unwrapSingleReview(response: ApiResponse<{ review: AdminReview }>): AdminReview | null {
  const raw =
    response.data?.review ??
    (response as { data?: { review?: AdminReview } }).data?.review;

  if (!raw) {
    return null;
  }

  return mapAdminReview(raw as unknown as Record<string, unknown>);
}

export async function approveAdminReview(id: number): Promise<ApiResponse<{ review: AdminReview }>> {
  const response = await apiClient.put<{ review: AdminReview }>(`/admin/reviews/${id}/approve`);
  const review = unwrapSingleReview(response);

  return review ? { ...response, data: { review } } : response;
}

export async function rejectAdminReview(id: number): Promise<ApiResponse<{ review: AdminReview }>> {
  const response = await apiClient.put<{ review: AdminReview }>(`/admin/reviews/${id}/reject`);
  const review = unwrapSingleReview(response);

  return review ? { ...response, data: { review } } : response;
}

export async function updateAdminReview(
  id: number,
  input: {
    rating?: number;
    body?: string;
    admin_note?: string | null;
    censor?: boolean;
  },
): Promise<ApiResponse<{ review: AdminReview }>> {
  const response = await apiClient.put<{ review: AdminReview }>(`/admin/reviews/${id}`, input);
  const review = unwrapSingleReview(response);

  return review ? { ...response, data: { review } } : response;
}

export async function deleteAdminReview(id: number): Promise<ApiResponse<unknown>> {
  return apiClient.delete(`/admin/reviews/${id}`);
}

export function reviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case "approved":
      return "تایید شده";
    case "rejected":
      return "رد شده";
    default:
      return "در انتظار تایید";
  }
}

export function reviewStatusClass(status: ReviewStatus): string {
  switch (status) {
    case "approved":
      return "border-[#34d399]/25 bg-[#34d399]/10 text-[#86efac]";
    case "rejected":
      return "border-[#f87171]/25 bg-[#f87171]/10 text-[#fca5a5]";
    default:
      return "border-[#f5c518]/25 bg-[#f5c518]/10 text-[#f8d977]";
  }
}
