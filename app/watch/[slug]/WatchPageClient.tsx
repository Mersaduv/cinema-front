"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { gql, Provider, useQuery } from "urql";
import HlsVideoPlayer from "../../components/player/HlsVideoPlayer";
import { getUrqlClient } from "../../lib/graphql/client";

const WatchMovieDocument = gql`
  query WatchMovie($slug: String!) {
    watchMovie(slug: $slug) {
      hls_url
      subtitle_url
      dubbed_audio_url
    }
  }
`;

const WatchEpisodeDocument = gql`
  query WatchEpisode($seriesSlug: String!, $season: Int!, $episode: Int!) {
    watchEpisode(seriesSlug: $seriesSlug, season: $season, episode: $episode) {
      hls_url
      subtitle_url
      episode {
        title
      }
      series {
        slug
        title
        poster_url
      }
    }
  }
`;
import { moviesService, type PublicMovie } from "../../lib/movies";
import { seriesService, type PublicSeries, type PublicSeriesEpisode } from "../../lib/series";

function findEpisode(
  series: PublicSeries,
  seasonNumber: number,
  episodeNumber: number,
): PublicSeriesEpisode | null {
  for (const season of series.seasons || []) {
    if (season.season_number !== seasonNumber) {
      continue;
    }

    const episode = season.episodes.find(
      (item) => item.episode_number === episodeNumber,
    );

    if (episode) {
      return episode;
    }
  }

  return null;
}

function WatchPageInner() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const seasonParam = searchParams.get("season");
  const episodeParam = searchParams.get("episode");

  const isSeriesPlayback = Boolean(seasonParam && episodeParam);

  const [movie, setMovie] = useState<PublicMovie | null>(null);
  const [series, setSeries] = useState<PublicSeries | null>(null);
  const [restLoading, setRestLoading] = useState(!isSeriesPlayback);
  const [error, setError] = useState("");

  const [{ data: watchMovieData, fetching: watchMovieFetching }] = useQuery({
    query: WatchMovieDocument,
    variables: { slug },
    pause: isSeriesPlayback || !slug,
  });

  const [{ data: watchEpisodeData, fetching: watchEpisodeFetching }] = useQuery({
    query: WatchEpisodeDocument,
    variables: {
      seriesSlug: slug,
      season: Number(seasonParam),
      episode: Number(episodeParam),
    },
    pause: !isSeriesPlayback || !slug,
  });

  useEffect(() => {
    if (isSeriesPlayback) {
      return;
    }

    const loadFallback = async () => {
      setRestLoading(true);
      setError("");
      setMovie(null);
      setSeries(null);

      const response = await moviesService.show(slug);

      if (response.success && response.data?.movie) {
        setMovie(response.data.movie);
        setRestLoading(false);
        return;
      }

      const seriesResponse = await seriesService.show(slug);

      if (seriesResponse.success && seriesResponse.data?.series) {
        setSeries(seriesResponse.data.series);
      } else {
        setError(response.message || "دریافت اطلاعات پخش انجام نشد.");
      }

      setRestLoading(false);
    };

    if (slug && !watchMovieData?.watchMovie?.hls_url && !watchMovieFetching) {
      void loadFallback();
    }
  }, [slug, isSeriesPlayback, watchMovieData, watchMovieFetching]);

  const seriesEpisode = useMemo(() => {
    if (!series || !seasonParam || !episodeParam) {
      return null;
    }

    return findEpisode(series, Number(seasonParam), Number(episodeParam));
  }, [series, seasonParam, episodeParam]);

  const loading =
    (isSeriesPlayback && watchEpisodeFetching) ||
    (!isSeriesPlayback && watchMovieFetching && restLoading);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black">
        <div className="h-full w-full animate-pulse bg-white/[0.03]" />
      </div>
    );
  }

  if (isSeriesPlayback && watchEpisodeData?.watchEpisode?.hls_url) {
    const watch = watchEpisodeData.watchEpisode;

    return (
      <HlsVideoPlayer
        src={watch.hls_url}
        poster={watch.series.poster_url}
        title={`${watch.series.title} — ${watch.episode.title}`}
        backHref={`/series/${watch.series.slug}`}
        immersive
        subtitleUrl={watch.subtitle_url ?? undefined}
      />
    );
  }

  if (seriesEpisode?.hls_url) {
    return (
      <HlsVideoPlayer
        src={seriesEpisode.hls_url}
        poster={seriesEpisode.still_url || series?.poster_url}
        title={`${series?.title || "سریال"} — ${seriesEpisode.title}`}
        backHref={`/series/${series?.slug || slug}`}
        immersive
        subtitleUrl={seriesEpisode.subtitle_url}
      />
    );
  }

  const watchMovie = watchMovieData?.watchMovie;

  if (watchMovie?.hls_url) {
    return (
      <HlsVideoPlayer
        src={watchMovie.hls_url}
        poster={movie?.poster_url}
        title={movie?.title || slug}
        backHref={`/movies/${slug}`}
        immersive
        subtitleUrl={watchMovie.subtitle_url ?? undefined}
      />
    );
  }

  if (movie?.playback?.master_playlist_url) {
    return (
      <HlsVideoPlayer
        src={movie.playback.master_playlist_url}
        poster={movie.poster_url}
        title={movie.title}
        backHref={`/movies/${movie.slug}`}
        immersive
        availableVariants={movie.playback.variants}
        availableAudioTracks={movie.playback.audio_tracks || []}
        subtitleUrl={movie.playback.subtitle_url || movie.subtitle_source_url}
      />
    );
  }

  if (series && !isSeriesPlayback) {
    const firstEpisode = series.seasons?.[0]?.episodes?.[0];

    if (firstEpisode?.hls_url) {
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
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black p-6">
      <div className="max-w-2xl rounded-[32px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-[#fecdd3]">
        {error || "خروجی HLS برای این عنوان آماده نیست."}
      </div>
    </div>
  );
}

export default function WatchPageClient() {
  return (
    <Provider value={getUrqlClient()}>
      <WatchPageInner />
    </Provider>
  );
}
