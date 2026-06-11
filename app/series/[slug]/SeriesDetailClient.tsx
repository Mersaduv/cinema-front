"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import ContentDetailPage from "../../components/content/ContentDetailPage";
import { toCatalogItem } from "../../lib/catalog/rest";
import { seriesService, type PublicSeries, type PublicSeriesSeason } from "../../lib/series";

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

  const [loadedSeasons, setLoadedSeasons] = useState<PublicSeriesSeason[] | null>(null);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [similarSeries, setSimilarSeries] = useState<PublicSeries[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const episodesRequestedRef = useRef(false);
  const similarRequestedRef = useRef(false);

  const series = useMemo(
    () => ({
      ...refreshedSeries,
      seasons: loadedSeasons ?? refreshedSeries.seasons,
    }),
    [loadedSeasons, refreshedSeries],
  );

  const loadEpisodes = useCallback(async () => {
    if (episodesRequestedRef.current) {
      return;
    }

    episodesRequestedRef.current = true;
    setEpisodesLoading(true);

    try {
      const response = await seriesService.episodes(series.slug);

      if (response.success && response.data?.seasons) {
        setLoadedSeasons(response.data.seasons);
      }
    } finally {
      setEpisodesLoading(false);
    }
  }, [series.slug]);

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
        void loadEpisodes();
      }}
      onRequestSimilar={() => {
        void loadSimilar();
      }}
    />
  );
}
