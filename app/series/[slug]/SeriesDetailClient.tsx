"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { AuthProvider } from "@/app/contexts/AuthContext";
import ContentDetailPage from "../../components/content/ContentDetailPage";
import ContentPreviewBanner from "../../components/content/ContentPreviewBanner";
import DetailScrollReset from "../../components/content/DetailScrollReset";
import { DETAIL_SWR_DEDUP_MS } from "../../lib/detail/constants";
import { useSeriesDetailPeople } from "../../lib/detail/useDetailPeople";
import { toCatalogItem } from "../../lib/catalog/rest";
import { preserveContentWarnings } from "../../lib/preserve-content-warnings";
import {
  defaultReviewPaginator,
  defaultReviewSummary,
} from "../../lib/reviews";
import { seriesService, type PublicSeries } from "../../lib/series";
import { useSeriesEpisodes } from "../../lib/useSeriesEpisodes";

export default function SeriesDetailClient({
  series: initialSeries,
  previewMode = false,
}: {
  series: PublicSeries;
  previewMode?: boolean;
}) {
  const { data: swrSeries = initialSeries } = useSWR(
    previewMode ? null : `series:detail:${initialSeries.slug}`,
    async () => {
      const response = await seriesService.show(initialSeries.slug, { lite: true });
      if (response.success && response.data?.series) {
        return response.data.series;
      }

      return initialSeries;
    },
    {
      fallbackData: initialSeries,
      revalidateOnMount: false,
      revalidateOnFocus: !previewMode,
      dedupingInterval: DETAIL_SWR_DEDUP_MS,
    },
  );

  const baseSeries = useMemo(
    () => preserveContentWarnings(initialSeries, swrSeries),
    [initialSeries, swrSeries],
  );

  const { series: seriesWithPeople, peopleLoading } = useSeriesDetailPeople(
    initialSeries.slug,
    baseSeries,
    !previewMode,
  );

  const [episodesEnabled, setEpisodesEnabled] = useState(previewMode);
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
      ...seriesWithPeople,
      seasons: loadedSeasons ?? seriesWithPeople.seasons,
    }),
    [loadedSeasons, seriesWithPeople],
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
      initialReviews: previewMode ? (series.reviews?.reviews ?? []) : [],
      initialSummary: previewMode
        ? (series.reviews?.summary ?? defaultReviewSummary())
        : defaultReviewSummary(),
      initialPaginator: previewMode
        ? (series.reviews?.paginatorInfo ?? defaultReviewPaginator())
        : defaultReviewPaginator(),
      userReview: previewMode ? (series.reviews?.user_review ?? null) : null,
      cachedAvgRating: series.cached_avg_rating ?? null,
    }),
    [previewMode, series],
  );

  return (
    <AuthProvider>
      <DetailScrollReset />
      {previewMode ? <ContentPreviewBanner /> : null}
      <ContentDetailPage
        kind="series"
        series={series}
        castLoading={!previewMode && peopleLoading}
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
          if (!previewMode) {
            void loadSimilar();
          }
        }}
      />
    </AuthProvider>
  );
}
