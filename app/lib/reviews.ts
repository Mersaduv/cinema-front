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

const MY_REVIEWS_CACHE_KEY = "cinema:my-reviews-cache:v1";

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

function normalizeReviewStatusFromRow(
  row: Record<string, unknown>,
): { status?: ReviewStatus; isPending: boolean } {
  const rawStatus = String(
    row.status ??
      row.review_status ??
      row.moderation_status ??
      row.state ??
      row.review_state ??
      "",
  )
    .trim()
    .toLowerCase();

  const approvedAt = row.approved_at ?? row.moderated_at ?? row.published_at;
  const rejectedAt = row.rejected_at;
  const pendingFlag = Boolean(row.is_pending ?? row.pending);
  const approvedFlag = Boolean(row.is_approved ?? row.approved);
  const rejectedFlag = Boolean(row.is_rejected ?? row.rejected);

  if (rejectedAt || rejectedFlag || rawStatus.includes("reject")) {
    return { status: "rejected", isPending: false };
  }

  if (
    approvedAt ||
    approvedFlag ||
    rawStatus === "approved" ||
    rawStatus === "published" ||
    rawStatus.includes("approve")
  ) {
    return { status: "approved", isPending: false };
  }

  if (
    pendingFlag ||
    rawStatus === "pending" ||
    rawStatus === "in_review" ||
    rawStatus.includes("pending") ||
    rawStatus.includes("review")
  ) {
    return { status: "pending", isPending: true };
  }

  return { status: undefined, isPending: pendingFlag };
}

function mapReview(row: Record<string, unknown>): Review {
  const user = (row.user as Record<string, unknown>) ?? {};
  const moderation = normalizeReviewStatusFromRow(row);

  return {
    id: Number(row.id),
    user: {
      id: Number(user.id),
      name: String(user.name ?? ""),
      avatar_url: (user.avatar_url as string | null) ?? null,
    },
    rating: Number(row.rating),
    body: (row.body as string | null) ?? null,
    status: moderation.status,
    is_pending: moderation.isPending,
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
  const response = await apiClient.delete(`/reviews/${id}`);
  if (response.success) {
    removeCachedMyReview(id);
  }
  return response;
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

export type ProfileReviewItem = Review & {
  reviewable_type?: "movie" | "series";
  reviewable_slug?: string | null;
  reviewable_title?: string | null;
};

type ProfileReviewsPayload = {
  reviews: ProfileReviewItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

function mapProfileReview(row: Record<string, unknown>): ProfileReviewItem {
  const reviewable = (row.reviewable as Record<string, unknown> | undefined) ?? {};
  const modelType = String(
    row.reviewable_type ?? reviewable.type ?? reviewable.model_type ?? "",
  ).toLowerCase();
  const normalizedType =
    modelType.includes("movie") || modelType === "movie"
      ? "movie"
      : modelType.includes("series") || modelType.includes("show") || modelType === "series"
        ? "series"
        : undefined;
  const reviewableType =
    normalizedType ??
    (row.reviewable_type as "movie" | "series" | undefined) ??
    (reviewable.type as "movie" | "series" | undefined);
  const reviewableSlug =
    (row.reviewable_slug as string | undefined) ??
    (reviewable.slug as string | undefined) ??
    null;
  const reviewableTitle =
    (row.reviewable_title as string | undefined) ??
    (reviewable.title as string | undefined) ??
    null;

  return {
    ...mapReview(row),
    reviewable_type: reviewableType,
    reviewable_slug: reviewableSlug,
    reviewable_title: reviewableTitle,
  };
}

function mapProfileReviewsResponse(data: Record<string, unknown>): ProfileReviewsPayload {
  const rawReviews = Array.isArray(data.reviews)
    ? (data.reviews as Record<string, unknown>[])
    : [];
  const rawPagination = (data.pagination as Record<string, unknown> | undefined) ?? {};

  return {
    reviews: rawReviews.map((row) => mapProfileReview(row)),
    pagination: {
      current_page: Number(rawPagination.current_page ?? 1),
      last_page: Number(rawPagination.last_page ?? 1),
      per_page: Number(rawPagination.per_page ?? (rawReviews.length > 0 ? rawReviews.length : 10)),
      total: Number(rawPagination.total ?? rawReviews.length),
    },
  };
}

export async function fetchMyReviews(options?: {
  page?: number;
  status?: ReviewStatus | "all";
}): Promise<ApiResponse<ProfileReviewsPayload>> {
  const page = options?.page ?? 1;
  const perPage = 10;
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));

  const applyLocalFilterAndPagination = (rows: ProfileReviewItem[]): ProfileReviewsPayload => {
    const filtered =
      options?.status && options.status !== "all"
        ? rows.filter((review) => {
            const status = review.status ?? (review.is_pending ? "pending" : "approved");
            return status === options.status;
          })
        : rows;

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      reviews: pageItems,
      pagination: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total: filtered.length,
      },
    };
  };

  const configuredEndpoint = (process.env.NEXT_PUBLIC_MY_REVIEWS_ENDPOINT ?? "").trim();
  if (!configuredEndpoint) {
    await refreshCachedReviewStatusesFromDetailEndpoints();
    return {
      success: true,
      data: applyLocalFilterAndPagination(readCachedMyReviews()),
    };
  }

  const endpoints = [`${configuredEndpoint}?${params.toString()}`];

  for (const endpoint of endpoints) {
    const response = await apiClient.get<Record<string, unknown>>(endpoint);
    if (!response.success || !response.data) {
      continue;
    }

    const mapped = mapProfileReviewsResponse(response.data);
    upsertCachedMyReviews(mapped.reviews);
    return {
      success: true,
      status: response.status,
      message: response.message,
      data: mapped,
    };
  }

  return {
    success: true,
    data: applyLocalFilterAndPagination(readCachedMyReviews()),
  };
}

async function refreshCachedReviewStatusesFromDetailEndpoints(): Promise<void> {
  const cached = readCachedMyReviews();
  if (cached.length === 0) {
    return;
  }

  const uniqueTargets = Array.from(
    new Map(
      cached
        .filter((item) => item.reviewable_type && item.reviewable_slug)
        .map((item) => [
          `${item.reviewable_type}:${item.reviewable_slug}`,
          {
            type: item.reviewable_type as "movie" | "series",
            slug: item.reviewable_slug as string,
          },
        ]),
    ).values(),
  ).slice(0, 12);

  const refreshed: ProfileReviewItem[] = [];

  for (const target of uniqueTargets) {
    const params = new URLSearchParams({ page: "1", per_page: "10", sort: "newest" });
    const endpoint = `/${target.type === "movie" ? "movies" : "series"}/${target.slug}/reviews?${params.toString()}`;
    const response = await apiClient.get<ReviewsApiData>(endpoint);
    if (!response.success || !response.data) {
      continue;
    }

    const mapped = mapReviewsResponse(response.data);
    const own = mapped.user_review ?? mapped.reviews.find((review) => review.is_own) ?? null;
    if (!own) {
      continue;
    }

    refreshed.push({
      ...own,
      reviewable_type: target.type,
      reviewable_slug: target.slug,
      reviewable_title:
        cached.find(
          (item) =>
            item.reviewable_type === target.type &&
            item.reviewable_slug?.toLowerCase() === target.slug.toLowerCase(),
        )?.reviewable_title ?? null,
    });
  }

  if (refreshed.length > 0) {
    upsertCachedMyReviews(refreshed);
  }
}

function readCachedMyReviews(): ProfileReviewItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(MY_REVIEWS_CACHE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ProfileReviewItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedMyReviews(reviews: ProfileReviewItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(MY_REVIEWS_CACHE_KEY, JSON.stringify(reviews.slice(0, 100)));
}

function upsertCachedMyReviews(reviews: ProfileReviewItem[]): void {
  if (reviews.length === 0) {
    return;
  }
  const current = readCachedMyReviews();
  const byId = new Map<number, ProfileReviewItem>(current.map((item) => [item.id, item]));
  for (const review of reviews) {
    const existing = byId.get(review.id);
    byId.set(review.id, {
      ...existing,
      ...review,
      reviewable_type: review.reviewable_type ?? existing?.reviewable_type,
      reviewable_slug: review.reviewable_slug ?? existing?.reviewable_slug ?? null,
      reviewable_title: review.reviewable_title ?? existing?.reviewable_title ?? null,
    });
  }
  const merged = Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
  writeCachedMyReviews(merged);
}

export function upsertCachedMyReview(input: {
  review: Review;
  reviewableType?: "movie" | "series";
  reviewableSlug?: string | null;
  reviewableTitle?: string | null;
}): void {
  const item: ProfileReviewItem = {
    ...input.review,
    reviewable_type: input.reviewableType,
    reviewable_slug: input.reviewableSlug ?? null,
    reviewable_title: input.reviewableTitle ?? null,
  };
  upsertCachedMyReviews([item]);
}

export function getCachedMyReviews(): ProfileReviewItem[] {
  return readCachedMyReviews();
}

export function getCachedMyReviewFor(
  reviewableType: "movie" | "series",
  reviewableSlug: string,
): ProfileReviewItem | null {
  const normalizedSlug = reviewableSlug.trim().toLowerCase();
  return (
    readCachedMyReviews().find(
      (item) =>
        item.reviewable_type === reviewableType &&
        (item.reviewable_slug ?? "").trim().toLowerCase() === normalizedSlug,
    ) ?? null
  );
}

export function removeCachedMyReview(id: number): void {
  const current = readCachedMyReviews();
  writeCachedMyReviews(current.filter((item) => item.id !== id));
}
