import { apiClient, type ApiResponse } from "./api";

export const REVIEW_BODY_MIN = 3;
export const REVIEW_BODY_MAX = 2000;

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: number;
  user: { id: number; name: string; avatar_url: string | null };
  rating: number;
  body: string | null;
  status?: ReviewStatus;
  is_pending?: boolean;
  created_at: string;
  is_own: boolean;
}

export interface ReviewSummary {
  total_count: number;
  average_rating: number;
  distribution: Record<string, number>;
}

export interface ReviewsPayload {
  reviews: Review[];
  summary: ReviewSummary;
  user_review: Review | null;
  paginatorInfo: { currentPage: number; lastPage: number; total: number };
}

export type ReviewSort = "newest" | "oldest" | "top_rated";

export const defaultReviewSummary = (): ReviewSummary => ({
  total_count: 0,
  average_rating: 0,
  distribution: Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => [String(index + 1), 0]),
  ),
});

export const defaultReviewPaginator = (): ReviewsPayload["paginatorInfo"] => ({
  currentPage: 1,
  lastPage: 1,
  total: 0,
});

type ReviewsApiData = {
  reviews: Review[];
  summary: ReviewSummary;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  user_review: Review | null;
};

function mapReview(row: Record<string, unknown>): Review {
  const user = (row.user as Record<string, unknown>) ?? {};

  return {
    id: Number(row.id),
    user: {
      id: Number(user.id),
      name: String(user.name ?? ""),
      avatar_url: (user.avatar_url as string | null) ?? null,
    },
    rating: Number(row.rating),
    body: (row.body as string | null) ?? null,
    status: (row.status as ReviewStatus | undefined) ?? undefined,
    is_pending: Boolean(row.is_pending ?? row.status === "pending"),
    created_at: String(row.created_at ?? ""),
    is_own: Boolean(row.is_own),
  };
}

function mapReviewsResponse(data: ReviewsApiData): ReviewsPayload {
  return {
    reviews: (data.reviews ?? []).map((row) =>
      mapReview(row as unknown as Record<string, unknown>),
    ),
    summary: data.summary ?? defaultReviewSummary(),
    user_review: data.user_review
      ? mapReview(data.user_review as unknown as Record<string, unknown>)
      : null,
    paginatorInfo: {
      currentPage: data.pagination?.current_page ?? 1,
      lastPage: data.pagination?.last_page ?? 1,
      total: data.pagination?.total ?? 0,
    },
  };
}

export function validateReviewForm(input: {
  rating: number;
  body: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedBody = input.body.trim();

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 10) {
    errors.rating = "امتیاز باید بین ۱ تا ۱۰ باشد.";
  }

  if (!trimmedBody) {
    errors.body = "متن نظر الزامی است.";
  } else if (trimmedBody.length < REVIEW_BODY_MIN) {
    errors.body = `متن نظر باید حداقل ${REVIEW_BODY_MIN.toLocaleString("fa-IR")} کاراکتر باشد.`;
  } else if (trimmedBody.length > REVIEW_BODY_MAX) {
    errors.body = `متن نظر نباید بیشتر از ${REVIEW_BODY_MAX.toLocaleString("fa-IR")} کاراکتر باشد.`;
  }

  return errors;
}

export async function fetchReviews(
  contentType: "movie" | "series",
  slug: string,
  options?: { page?: number; sort?: ReviewSort; perPage?: number },
): Promise<ReviewsPayload> {
  const params = new URLSearchParams();
  params.set("page", String(options?.page ?? 1));
  params.set("per_page", String(options?.perPage ?? 10));
  if (options?.sort) {
    params.set("sort", options.sort);
  }

  const endpoint = `/${contentType === "movie" ? "movies" : "series"}/${slug}/reviews?${params}`;
  const response = await apiClient.get<ReviewsApiData>(endpoint);

  if (!response.success || !response.data) {
    throw new Error(response.message ?? "دریافت نظرات انجام نشد.");
  }

  return mapReviewsResponse(response.data);
}

function unwrapReviewResponse(
  response: ApiResponse<{ review: Review }>,
): ApiResponse<{ review: Review }> {
  const raw = response.data?.review ?? (response as { review?: Review }).review;

  if (!raw) {
    return response;
  }

  return {
    ...response,
    data: {
      review: mapReview(raw as unknown as Record<string, unknown>),
    },
  };
}

export async function submitReview(input: {
  reviewable_type: "movie" | "series";
  slug: string;
  rating: number;
  body: string;
}): Promise<ApiResponse<{ review: Review }>> {
  const response = await apiClient.post<{ review: Review }>("/reviews", input);
  return unwrapReviewResponse(response);
}

export async function updateReview(
  id: number,
  input: { rating?: number; body: string },
): Promise<ApiResponse<{ review: Review }>> {
  const response = await apiClient.put<{ review: Review }>(`/reviews/${id}`, input);
  return unwrapReviewResponse(response);
}

export async function deleteReview(id: number): Promise<ApiResponse<unknown>> {
  return apiClient.delete(`/reviews/${id}`);
}

export function formatRelativeTimeFa(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "نامشخص";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "همین الان";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} دقیقه پیش`;
  }
  if (diffHours < 24) {
    return `${diffHours} ساعت پیش`;
  }
  if (diffDays < 30) {
    return `${diffDays} روز پیش`;
  }

  return date.toLocaleDateString("fa-IR");
}
