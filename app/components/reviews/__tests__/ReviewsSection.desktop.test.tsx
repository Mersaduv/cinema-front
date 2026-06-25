import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReviewsSection from "../ReviewsSection";
import { defaultReviewPaginator, defaultReviewSummary } from "../../../lib/reviews";

vi.mock("../../../hooks/useTvCapabilities", () => ({
  useIsTv: () => false,
  useIsTvCompat: () => false,
  useIsTvUi: () => false,
}));

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 }, isAuthenticated: true, loading: false }),
}));

vi.mock("swr", () => ({
  default: () => ({
    data: undefined,
    mutate: vi.fn(),
    isValidating: false,
  }),
}));

describe("ReviewsSection desktop", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the write form when isTv is false", () => {
    render(
      <ReviewsSection
        contentType="movie"
        slug="test-movie"
        initialReviews={[]}
        initialSummary={defaultReviewSummary()}
        initialPaginator={defaultReviewPaginator()}
        userReview={null}
        cachedAvgRating={null}
      />,
    );

    expect(
      screen.getByPlaceholderText("نظر خود را درباره این اثر بنویسید..."),
    ).toBeTruthy();
    expect(screen.queryByText(/برای نوشتن نقد، از مرورگر موبایل/)).toBeNull();
  });
});
