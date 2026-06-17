"use client";

import useSWR from "swr";
import { seriesService, type PublicSeriesSeason } from "./series";

export function seriesEpisodesSwrKey(slug: string): string {
  return `series:episodes:${slug}`;
}

async function fetchSeriesEpisodes(slug: string): Promise<PublicSeriesSeason[]> {
  const response = await seriesService.episodes(slug);
  if (!response.success || !response.data?.seasons) {
    throw new Error(response.message || "دریافت قسمت‌ها انجام نشد.");
  }

  return response.data.seasons;
}

/** Shared lazy episode list — same cache/revalidation as series detail page. */
export function useSeriesEpisodes(slug: string, enabled: boolean) {
  return useSWR(
    enabled && slug ? seriesEpisodesSwrKey(slug) : null,
    () => fetchSeriesEpisodes(slug),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0,
    },
  );
}
