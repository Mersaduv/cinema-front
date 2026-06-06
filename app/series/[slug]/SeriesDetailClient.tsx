"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ContentDetailPage from "../../components/content/ContentDetailPage";
import { seriesService, type PublicSeries } from "../../lib/series";

export default function SeriesDetailClient({
  series: initialSeries,
}: {
  series: PublicSeries;
}) {
  const [series, setSeries] = useState(initialSeries);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [similarSeries, setSimilarSeries] = useState<PublicSeries[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const episodesRequestedRef = useRef(false);
  const similarRequestedRef = useRef(false);

  const loadEpisodes = useCallback(async () => {
    if (episodesRequestedRef.current) {
      return;
    }

    episodesRequestedRef.current = true;
    setEpisodesLoading(true);

    try {
      const response = await seriesService.episodes(series.slug);

      if (response.success && response.data?.seasons) {
        setSeries((current) => ({
          ...current,
          seasons: response.data?.seasons ?? [],
        }));
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
      const response = await seriesService.related(series.slug, 8);
      if (response.success && response.data?.series) {
        setSimilarSeries(response.data.series);
      }
    } finally {
      setSimilarLoading(false);
    }
  }, [series.slug]);

  useEffect(() => {
    void loadSimilar();
  }, [loadSimilar]);

  return (
    <ContentDetailPage
      kind="series"
      series={series}
      similarItems={similarSeries.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        synopsis: item.synopsis,
        poster_url: item.poster_url,
        backdrop_url: item.backdrop_url ?? item.details.backdrop_url ?? null,
        release_year: item.release_year,
        details: item.details,
      }))}
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
