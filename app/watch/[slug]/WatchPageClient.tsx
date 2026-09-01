"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useEffect, useRef } from "react";
import { Provider } from "urql";
import { getUrqlClient } from "../../lib/graphql/client";
import type { PublicMovie } from "../../lib/movies";
import type {
  WatchMediaInfo,
} from "../../features/player/types/player.types";
import type { DrmConfig } from "../../features/player/types/playback.types";
import { PlayerSkeleton } from "../../features/player/components/PlayerSkeleton";
import { WatchAuthGate } from "../../components/WatchAuthGate";
import HlsVideoPlayer from "../../components/player/HlsVideoPlayer";
import TvPolyfills from "./TvPolyfills";
import { useWatchData } from "./hooks/useWatchData";

function buildDrmConfig(
  drm?: { scheme?: string | null; licenseUrl?: string | null } | null,
): DrmConfig | undefined {
  if (!drm?.scheme || drm.scheme === "none" || !drm.licenseUrl) {
    return undefined;
  }

  return {
    scheme: drm.scheme as DrmConfig["scheme"],
    licenseUrl: drm.licenseUrl,
  };
}

type ManifestAudioTrackInput = {
  name: string;
  language: string;
  type: string;
};

function buildManifestAudioTracks(
  tracks?: ManifestAudioTrackInput[] | null,
  hasDubbedFallback = false,
) {
  if (tracks && tracks.length > 0) {
    return tracks.map((track, index) => ({
      key: String(index),
      label: track.name,
      language: track.language,
      is_default:
        track.type === "dubbed" ||
        track.language === "fa" ||
        track.language === "fas",
    }));
  }

  if (!hasDubbedFallback) {
    return [];
  }

  return [
    {
      key: "0",
      label: "Original Audio",
      language: "eng",
      is_default: false,
    },
    {
      key: "1",
      label: "دوبله فارسی",
      language: "fa",
      is_default: true,
    },
  ];
}

function buildMovieWatchMedia(movie: PublicMovie): WatchMediaInfo {
  return {
    mediaId: String(movie.id),
    mediaType: "movie",
    duration: movie.duration_seconds ?? undefined,
    title: movie.title,
    posterUrl:
      movie.poster_url ||
      movie.poster_image?.src ||
      movie.poster_image?.original ||
      null,
    slug: movie.slug,
  };
}

function buildEpisodeWatchMedia(
  seriesId: number,
  seriesSlug: string,
  seriesTitle: string,
  posterUrl: string | null | undefined,
  episode: {
    id: number;
    title: string;
    duration_minutes?: number | null;
    duration_seconds?: number | null;
  },
  seasonNumber: number,
  episodeNumber: number,
): WatchMediaInfo {
  const duration =
    episode.duration_seconds ??
    (episode.duration_minutes ? episode.duration_minutes * 60 : undefined);

  return {
    mediaId: String(seriesId),
    mediaType: "series",
    episodeId: String(episode.id),
    seasonNumber,
    episodeNumber,
    duration,
    title: `${seriesTitle} — ${episode.title}`,
    posterUrl,
    slug: seriesSlug,
    seriesSlug,
  };
}

const WatchPageInner = memo(function WatchPageInner() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const seasonParam = searchParams.get("season");
  const episodeParam = searchParams.get("episode");

  const {
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
    movie,
    series,
    seriesContext,
    knownTitle,
    knownPoster,
  } = useWatchData(slug, seasonParam, episodeParam);

  const lastHlsUrlRef = useRef<string | null>(null);
  const lastProgressiveUrlRef = useRef<string | null>(null);
  const playerEverMountedRef = useRef(false);

  if (hlsUrl) {
    lastHlsUrlRef.current = hlsUrl;
    playerEverMountedRef.current = true;
  }
  if (progressiveUrl) {
    lastProgressiveUrlRef.current = progressiveUrl;
    playerEverMountedRef.current = true;
  }

  const activeHlsUrl = hlsUrl ?? lastHlsUrlRef.current;
  const activeProgressiveUrl = progressiveUrl ?? lastProgressiveUrlRef.current;
  const activeHasSource = Boolean(activeHlsUrl || activeProgressiveUrl);
  const isEpisodeTransition =
    isSeriesPlayback && !hasPlayableSource && playerEverMountedRef.current;
  const showInitialSkeleton = showSkeleton && !playerEverMountedRef.current;

  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const previous = meta?.getAttribute("content") ?? null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyBackground = document.body.style.background;
    const previousHtmlBackground = document.documentElement.style.background;

    if (meta) {
      meta.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      );
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.background = "#000";
    document.documentElement.style.background = "#000";

    return () => {
      if (meta && previous) {
        meta.setAttribute("content", previous);
      }
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.background = previousBodyBackground;
      document.documentElement.style.background = previousHtmlBackground;
    };
  }, []);

  const handleEpisodeSelect = useCallback(
    (season: number, episode: number) => {
      router.push(`/watch/${slug}?season=${season}&episode=${episode}`);
    },
    [router, slug],
  );

  if (watchAuthError) {
    const redirectBack = isSeriesPlayback
      ? `/watch/${slug}?season=${seasonNumber}&episode=${episodeNumber}`
      : `/watch/${slug}`;

    return <WatchAuthGate redirectBack={redirectBack} />;
  }

  if (showInitialSkeleton) {
    return <PlayerSkeleton />;
  }

  if (isSeriesPlayback && activeHasSource) {
    const watch = watchEpisodeData?.watchEpisode;
    const seriesSlug = watch?.series.slug ?? series?.slug ?? slug;
    const seriesTitle = watch?.series.title ?? series?.title ?? knownTitle;
    const episodeTitle =
      watch?.episode.title ?? `قسمت ${episodeNumber}`;
    const subtitleUrl = watch?.subtitle_url ?? undefined;
    const dubbedAudioUrl = watch?.dubbed_audio_url ?? undefined;
    const manifestAudioTracks = buildManifestAudioTracks(
      watch?.audio_tracks,
      Boolean(dubbedAudioUrl),
    );

    return (
      <HlsVideoPlayer
        src={activeHlsUrl || ""}
        progressiveUrl={activeProgressiveUrl}
        isSourceTransitioning={isEpisodeTransition}
        dashUrl={watch?.dash_url ?? undefined}
        drm={buildDrmConfig(watch?.drm)}
        title={`${seriesTitle} — ${episodeTitle}`}
        backHref={`/series/${seriesSlug}`}
        immersive
        subtitleUrl={subtitleUrl}
        dubbedAudioUrl={dubbedAudioUrl}
        availableAudioTracks={manifestAudioTracks}
        seriesContext={seriesContext ?? undefined}
        onEpisodeSelect={handleEpisodeSelect}
        watchMedia={
          watch
            ? buildEpisodeWatchMedia(
                Number(watch.series.id),
                watch.series.slug,
                watch.series.title,
                watch.series.poster_url ?? knownPoster,
                {
                  id: Number(watch.episode.id),
                  title: watch.episode.title || episodeTitle,
                  duration_seconds: watch.episode.duration_seconds,
                },
                seasonNumber,
                episodeNumber,
              )
            : {
                mediaId: String(series?.id ?? slug),
                mediaType: "series",
                slug: seriesSlug,
                seriesSlug,
                seasonNumber,
                episodeNumber,
                title: `${seriesTitle} — ${episodeTitle}`,
                posterUrl: knownPoster,
              }
        }
      />
    );
  }

  if (!isSeriesPlayback && activeHasSource) {
    const watchMovie = watchMovieData?.watchMovie;
    const manifestAudioTracks = buildManifestAudioTracks(
      watchMovie?.audio_tracks,
      Boolean(watchMovie?.dubbed_audio_url),
    );

    return (
      <HlsVideoPlayer
        src={activeHlsUrl || ""}
        progressiveUrl={activeProgressiveUrl}
        isSourceTransitioning={false}
        dashUrl={watchMovie?.dash_url ?? undefined}
        drm={buildDrmConfig(watchMovie?.drm)}
        title={movie?.title ?? knownTitle}
        backHref={`/movies/${movie?.slug ?? watchMovie?.slug ?? slug}`}
        immersive
        subtitleUrl={watchMovie?.subtitle_url ?? undefined}
        dubbedAudioUrl={watchMovie?.dubbed_audio_url ?? undefined}
        availableAudioTracks={manifestAudioTracks}
        availableVariants={movie?.playback?.variants}
        watchMedia={
          movie
            ? buildMovieWatchMedia(movie)
            : watchMovie?.id
              ? {
                  mediaId: watchMovie.id,
                  mediaType: "movie",
                  slug: watchMovie.slug || slug,
                  title: knownTitle,
                  posterUrl: knownPoster,
                }
              : {
                  mediaId: slug,
                  mediaType: "movie",
                  slug,
                  title: knownTitle,
                  posterUrl: knownPoster,
                }
        }
      />
    );
  }

  if (series && !isSeriesPlayback) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black p-6">
        <div className="max-w-2xl rounded-[32px] border border-white/10 bg-white/[0.04] px-6 py-8 text-center text-white/80">
          <p className="mb-4">
            برای پخش این سریال یک قسمت را از صفحه جزئیات انتخاب کنید.
          </p>
          <Link
            href={`/series/${series.slug}`}
            className="inline-flex rounded-2xl bg-[#ef4444] px-5 py-3 text-sm font-bold text-white"
          >
            بازگشت به جزئیات سریال
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black p-6">
      <div className="max-w-2xl rounded-[32px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-[#fecdd3]">
        {restError || "خروجی پخش برای این عنوان آماده نیست."}
      </div>
    </div>
  );
});

export default function WatchPageClient() {
  return (
    <Provider value={getUrqlClient()}>
      <TvPolyfills />
      <WatchPageInner />
    </Provider>
  );
}
