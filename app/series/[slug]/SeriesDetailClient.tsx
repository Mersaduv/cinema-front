"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import ContentDetailPage from "../../components/content/ContentDetailPage";
import { toCatalogItem } from "../../lib/catalog/rest";
import { seriesService, type PublicSeries } from "../../lib/series";
import { useSeriesEpisodes } from "../../lib/useSeriesEpisodes";

export default function SeriesDetailClient({
  series: initialSeries,
}: {
  series: PublicSeries;
}) {
  const { data: refreshedSeries = initialSeries } = useSWR(
    `series:detail:${initialSeries.slug}`,
    async () => {
      const response = await seriesService.show(initialSeries.slug, { lite: true });
      if (response.success && response.data?.series) {
        return response.data.series;
      }

      return initialSeries;
    },
    {
      fallbackData: initialSeries,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      dedupingInterval: 0,
    },
  );

  const [episodesEnabled, setEpisodesEnabled] = useState(false);
  const [similarSeries, setSimilarSeries] = useState<PublicSeries[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const similarRequestedRef = useRef(false);

  const {
    data: loadedSeasons,
    isLoading: episodesLoading,
    mutate: revalidateEpisodes,
  } = useSeriesEpisodes(initialSeries.slug, episodesEnabled);

  useEffect(() => {
    const params = new URLSearchParams({ season: "1", episode: "1" });
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = `/watch/${initialSeries.slug}?${params.toString()}`;
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
  }, [initialSeries.slug]);

  const series = useMemo(
    () => ({
      ...refreshedSeries,
      seasons: loadedSeasons ?? refreshedSeries.seasons,
    }),
    [loadedSeasons, refreshedSeries],
  );

  const loadSimilar = useCallback(async () => {
    if (similarRequestedRef.current) {
      return;
    }

    similarRequestedRef.current = true;
    setSimilarLoading(true);

    try {
      const response = await seriesService.related(series.slug, 18);
      if (response.success && response.data?.series) {
        setSimilarSeries(response.data.series);
      }
    } finally {
      setSimilarLoading(false);
    }
  }, [series.slug]);

  const reviewsProps = useMemo(
    () => ({
      initialReviews: series.reviews?.reviews ?? [],
      initialSummary: series.reviews?.summary ?? {
        total_count: 0,
        average_rating: 0,
        distribution: Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => [String(index + 1), 0]),
        ),
      },
      initialPaginator: series.reviews?.paginatorInfo ?? {
        currentPage: 1,
        lastPage: 1,
        total: 0,
      },
      userReview: series.reviews?.user_review ?? null,
      cachedAvgRating: series.cached_avg_rating ?? null,
    }),
    [series],
  );

  return (
    <ContentDetailPage
      kind="series"
      series={series}
      reviewsProps={reviewsProps}
      similarItems={similarSeries.map((item) =>
        toCatalogItem(item as unknown as Record<string, unknown>, "has_dubbed"),
      )}
      episodesLoading={episodesLoading}
      similarLoading={similarLoading}
      onRequestEpisodes={() => {
        setEpisodesEnabled(true);
        void revalidateEpisodes();
      }}
      onRequestSimilar={() => {
        void loadSimilar();
      }}
    />
  );
}
