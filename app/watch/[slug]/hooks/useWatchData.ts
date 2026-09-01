"use client";

import { useEffect, useMemo, useState } from "react";
import { gql, useQuery } from "urql";
import useSWR from "swr";
import { moviesService, type PublicMovie } from "../../../lib/movies";
import { seriesService, type PublicSeries } from "../../../lib/series";
import type { SeriesPlaybackContext } from "../../../features/player/types/player.types";

const WatchMovieDocument = gql`
  query WatchMovie($slug: String!) {
    watchMovie(slug: $slug) {
      id
      slug
      hls_url
      progressive_url
      dash_url
      subtitle_url
      dubbed_audio_url
      drm {
        scheme
        licenseUrl
      }
      audio_tracks {
        name
        language
        type
      }
    }
  }
`;

const WatchEpisodeDocument = gql`
  query WatchEpisode($seriesSlug: String!, $season: Int!, $episode: Int!) {
    watchEpisode(seriesSlug: $seriesSlug, season: $season, episode: $episode) {
      hls_url
      video_url
      source_method
      dash_url
      subtitle_url
      dubbed_audio_url
      drm {
        scheme
        licenseUrl
      }
      audio_tracks {
        name
        language
        type
      }
      episode {
        id
        title
        episode_number
        duration_seconds
      }
      series {
        id
        slug
        title
        poster_url
      }
      next_episode {
        id
        season_number
        title
        episode_number
        hls_url
        video_url
        source_method
        dash_url
        subtitle_url
        dubbed_audio_url
      }
      prev_episode {
        id
        season_number
        title
        episode_number
        hls_url
        video_url
        source_method
        dash_url
        subtitle_url
        dubbed_audio_url
      }
    }
  }
`;

type GqlNavEpisode = {
  id?: string | number | null;
  season_number?: number | null;
  episode_number: number;
  title?: string | null;
  hls_url?: string | null;
  video_url?: string | null;
  source_method?: string | null;
  subtitle_url?: string | null;
  dubbed_audio_url?: string | null;
};

function isPlayableNavEpisode(gqlEp: GqlNavEpisode): boolean {
  return Boolean(gqlEp.hls_url?.trim() || gqlEp.video_url?.trim());
}

function mapGqlNavEpisode(
  gqlEp: GqlNavEpisode,
  fallbackSeason: number,
): SeriesPlaybackContext["nextEpisode"] {
  return {
    id: String(gqlEp.id ?? gqlEp.episode_number),
    seasonNumber: gqlEp.season_number ?? fallbackSeason,
    episodeNumber: gqlEp.episode_number,
    title: gqlEp.title || `قسمت ${gqlEp.episode_number}`,
    hlsUrl: gqlEp.hls_url ?? null,
    progressiveUrl: gqlEp.video_url ?? null,
    subtitleUrl: gqlEp.subtitle_url,
    dubbedAudioUrl: gqlEp.dubbed_audio_url,
  };
}

export function useWatchData(
  slug: string,
  seasonParam: string | null,
  episodeParam: string | null,
) {
  const isSeriesPlayback = Boolean(seasonParam && episodeParam);
  const seasonNumber = Number(seasonParam);
  const episodeNumber = Number(episodeParam);

  const [{ data: watchMovieData, error: watchMovieError, fetching: watchMovieFetching }] =
    useQuery({
      query: WatchMovieDocument,
      variables: { slug },
      pause: isSeriesPlayback || !slug,
      requestPolicy: "cache-and-network",
    });

  const [{ data: watchEpisodeData, error: watchEpisodeError, fetching: watchEpisodeFetching }] =
    useQuery({
      query: WatchEpisodeDocument,
      variables: {
        seriesSlug: slug,
        season: seasonNumber,
        episode: episodeNumber,
      },
      pause: !isSeriesPlayback || !slug,
      requestPolicy: "cache-and-network",
    });

  const graphqlMovieHls = watchMovieData?.watchMovie?.hls_url?.trim() || null;
  const graphqlMovieProgressive =
    watchMovieData?.watchMovie?.progressive_url?.trim() || null;
  const graphqlHasMovieSource = Boolean(graphqlMovieHls || graphqlMovieProgressive);

  // REST is only a fallback when GraphQL finished without a playable URL.
  const shouldFetchRestMovie =
    !isSeriesPlayback &&
    Boolean(slug) &&
    !watchMovieFetching &&
    !graphqlHasMovieSource &&
    !watchMovieError;

  const { data: movie, error: movieRestError } = useSWR(
    shouldFetchRestMovie ? `watch-rest-movie:${slug}` : null,
    async () => {
      const response = await moviesService.show(slug);
      if (response.success && response.data?.movie) {
        return response.data.movie;
      }

      const seriesResponse = await seriesService.show(slug);
      if (seriesResponse.success && seriesResponse.data?.series) {
        return { __seriesOnly: true as const, series: seriesResponse.data.series };
      }

      throw new Error(response.message || "دریافت اطلاعات پخش انجام نشد.");
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const [restError, setRestError] = useState("");

  useEffect(() => {
    if (movieRestError instanceof Error) {
      setRestError(movieRestError.message);
    }
  }, [movieRestError]);

  const movieData = useMemo(() => {
    if (!movie || "__seriesOnly" in movie) {
      return null;
    }
    return movie as PublicMovie;
  }, [movie]);

  const seriesFromRest = useMemo(() => {
    if (movie && "__seriesOnly" in movie) {
      return movie.series;
    }
    return null;
  }, [movie]);

  const series = useMemo((): PublicSeries | null => {
    if (isSeriesPlayback) {
      const gqlSeries = watchEpisodeData?.watchEpisode?.series;
      if (gqlSeries) {
        return {
          id: Number(gqlSeries.id),
          slug: gqlSeries.slug,
          title: gqlSeries.title,
          poster_url: gqlSeries.poster_url,
        } as PublicSeries;
      }

      return null;
    }

    return seriesFromRest;
  }, [isSeriesPlayback, seriesFromRest, watchEpisodeData?.watchEpisode?.series]);

  const graphqlEpisodeHls = watchEpisodeData?.watchEpisode?.hls_url?.trim() || null;
  const graphqlEpisodeProgressive =
    watchEpisodeData?.watchEpisode?.video_url?.trim() || null;
  const restMovieHls = movieData?.playback?.master_playlist_url?.trim() || null;
  const restMovieProgressive = movieData?.playback?.progressive_url?.trim() || null;

  const hlsUrl = useMemo(() => {
    if (isSeriesPlayback) {
      return graphqlEpisodeHls;
    }

    return graphqlMovieHls || restMovieHls;
  }, [graphqlEpisodeHls, graphqlMovieHls, isSeriesPlayback, restMovieHls]);

  const progressiveUrl = useMemo(() => {
    if (isSeriesPlayback) {
      return graphqlEpisodeProgressive;
    }

    return graphqlMovieProgressive || restMovieProgressive;
  }, [
    graphqlEpisodeProgressive,
    graphqlMovieProgressive,
    isSeriesPlayback,
    restMovieProgressive,
  ]);

  const hasPlayableSource = Boolean(hlsUrl || progressiveUrl);

  const seriesContext = useMemo((): SeriesPlaybackContext | null => {
    if (!isSeriesPlayback) {
      return null;
    }

    const watch = watchEpisodeData?.watchEpisode;
    if (!watch) {
      return null;
    }

    return {
      seriesSlug: watch.series.slug,
      seriesTitle: watch.series.title,
      posterUrl: watch.series.poster_url,
      seasons: [],
      currentSeason: seasonNumber,
      currentEpisode: episodeNumber,
      nextEpisode: watch.next_episode && isPlayableNavEpisode(watch.next_episode)
        ? mapGqlNavEpisode(watch.next_episode, seasonNumber)
        : null,
      prevEpisode: watch.prev_episode && isPlayableNavEpisode(watch.prev_episode)
        ? mapGqlNavEpisode(watch.prev_episode, seasonNumber)
        : null,
    };
  }, [episodeNumber, isSeriesPlayback, seasonNumber, watchEpisodeData?.watchEpisode]);

  const waitingForSource =
    !hasPlayableSource &&
    ((isSeriesPlayback && watchEpisodeFetching) ||
      (!isSeriesPlayback && watchMovieFetching));

  const waitingForRestFallback =
    !hasPlayableSource &&
    !waitingForSource &&
    shouldFetchRestMovie &&
    !movie &&
    !movieRestError;

  const showSkeleton = waitingForSource || waitingForRestFallback;

  const watchAuthError = useMemo(() => {
    const graphQLError = isSeriesPlayback ? watchEpisodeError : watchMovieError;

    return graphQLError?.graphQLErrors?.find(
      (entry) =>
        entry.extensions?.category === "authentication" ||
        entry.extensions?.code === "WATCH_AUTH_REQUIRED",
    );
  }, [isSeriesPlayback, watchEpisodeError, watchMovieError]);

  const knownPoster = isSeriesPlayback
    ? watchEpisodeData?.watchEpisode?.series?.poster_url ?? null
    : movieData?.poster_url ?? null;

  const knownTitle = isSeriesPlayback
    ? watchEpisodeData?.watchEpisode?.series?.title ?? slug
    : movieData?.title ?? slug;

  return {
    slug,
    isSeriesPlayback,
    seasonNumber,
    episodeNumber,
    hlsUrl,
    progressiveUrl,
    hasPlayableSource,
    showSkeleton,
    restError,
    watchAuthError,
    watchMovieData,
    watchEpisodeData,
    movie: movieData,
    series,
    seriesContext,
    knownPoster,
    knownTitle,
  };
}
