"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { AuthProvider } from "@/app/contexts/AuthContext";
import ContentDetailPage from "../../components/content/ContentDetailPage";
import ContentPreviewBanner from "../../components/content/ContentPreviewBanner";
import DetailScrollReset from "../../components/content/DetailScrollReset";
import { DETAIL_SWR_DEDUP_MS } from "../../lib/detail/constants";
import { useMovieDetailPeople } from "../../lib/detail/useDetailPeople";
import { toCatalogItem } from "../../lib/catalog/rest";
import { preserveContentWarnings } from "../../lib/preserve-content-warnings";
import {
  defaultReviewPaginator,
  defaultReviewSummary,
} from "../../lib/reviews";
import { moviesService, type PublicMovie, type PublicMovieListItem } from "../../lib/movies";

export default function MovieDetailClient({
  movie: initialMovie,
  previewMode = false,
}: {
  movie: PublicMovie;
  previewMode?: boolean;
}) {
  const { data: refreshedMovie = initialMovie } = useSWR(
    previewMode ? null : `movie:detail:${initialMovie.slug}`,
    async () => {
      const response = await moviesService.show(initialMovie.slug);
      if (response.success && response.data?.movie) {
        return response.data.movie;
      }

      return initialMovie;
    },
    {
      fallbackData: initialMovie,
      revalidateOnMount: false,
      revalidateOnFocus: !previewMode,
      dedupingInterval: DETAIL_SWR_DEDUP_MS,
    },
  );

  const baseMovie = useMemo(
    () => preserveContentWarnings(initialMovie, refreshedMovie),
    [initialMovie, refreshedMovie],
  );

  const { movie: movieWithPeople, peopleLoading } = useMovieDetailPeople(
    initialMovie.slug,
    baseMovie,
    !previewMode,
  );

  const [similarMovies, setSimilarMovies] = useState<PublicMovieListItem[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const similarRequestedRef = useRef(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = `/watch/${initialMovie.slug}`;
    document.head.appendChild(link);

    const prefetchPlayer = () => {
      void import("../../components/player/HlsVideoPlayer");
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(prefetchPlayer, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(prefetchPlayer, 500);
    }

    return () => {
      link.remove();
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [initialMovie.slug]);

  const loadSimilar = useCallback(async () => {
    if (similarRequestedRef.current) {
      return;
    }

    similarRequestedRef.current = true;
    setLoadingSimilar(true);

    try {
      const response = await moviesService.related(movieWithPeople.slug, 18);
      if (response.success && response.data?.movies) {
        setSimilarMovies(response.data.movies);
      }
    } finally {
      setLoadingSimilar(false);
    }
  }, [movieWithPeople.slug]);

  const reviewsProps = useMemo(
    () => ({
      initialReviews: previewMode ? (movieWithPeople.reviews?.reviews ?? []) : [],
      initialSummary: previewMode
        ? (movieWithPeople.reviews?.summary ?? defaultReviewSummary())
        : defaultReviewSummary(),
      initialPaginator: previewMode
        ? (movieWithPeople.reviews?.paginatorInfo ?? defaultReviewPaginator())
        : defaultReviewPaginator(),
      userReview: previewMode ? (movieWithPeople.reviews?.user_review ?? null) : null,
      cachedAvgRating: movieWithPeople.cached_avg_rating ?? null,
    }),
    [movieWithPeople, previewMode],
  );

  return (
    <AuthProvider>
      <DetailScrollReset />
      {previewMode ? <ContentPreviewBanner /> : null}
      <ContentDetailPage
        kind="movie"
        movie={movieWithPeople}
        castLoading={!previewMode && peopleLoading}
        similarLoading={loadingSimilar}
        onRequestSimilar={() => {
          if (!previewMode) {
            void loadSimilar();
          }
        }}
        reviewsProps={reviewsProps}
        similarItems={similarMovies.map((item) =>
          toCatalogItem(item as unknown as Record<string, unknown>, "has_dubbed_audio"),
        )}
      />
    </AuthProvider>
  );
}
