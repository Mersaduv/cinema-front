"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import ContentDetailPage from "../../components/content/ContentDetailPage";
import { toCatalogItem } from "../../lib/catalog/rest";
import { moviesService, type PublicMovie, type PublicMovieListItem } from "../../lib/movies";

export default function MovieDetailClient({
  movie: initialMovie,
}: {
  movie: PublicMovie;
}) {
  const { data: movie = initialMovie } = useSWR(
    `movie:detail:${initialMovie.slug}`,
    async () => {
      const response = await moviesService.show(initialMovie.slug);
      if (response.success && response.data?.movie) {
        return response.data.movie;
      }

      return initialMovie;
    },
    {
      fallbackData: initialMovie,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      dedupingInterval: 0,
    },
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
      const response = await moviesService.related(movie.slug, 18);
      if (response.success && response.data?.movies) {
        setSimilarMovies(response.data.movies);
      }
    } finally {
      setLoadingSimilar(false);
    }
  }, [movie.slug]);

  const reviewsProps = useMemo(
    () => ({
      initialReviews: movie.reviews?.reviews ?? [],
      initialSummary: movie.reviews?.summary ?? {
        total_count: 0,
        average_rating: 0,
        distribution: Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => [String(index + 1), 0]),
        ),
      },
      initialPaginator: movie.reviews?.paginatorInfo ?? {
        currentPage: 1,
        lastPage: 1,
        total: 0,
      },
      userReview: movie.reviews?.user_review ?? null,
      cachedAvgRating: movie.cached_avg_rating ?? null,
    }),
    [movie],
  );

  return (
    <ContentDetailPage
      kind="movie"
      movie={movie}
      similarLoading={loadingSimilar}
      onRequestSimilar={() => {
        void loadSimilar();
      }}
      reviewsProps={reviewsProps}
      similarItems={similarMovies.map((item) =>
        toCatalogItem(item as unknown as Record<string, unknown>, "has_dubbed_audio"),
      )}
    />
  );
}
