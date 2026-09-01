"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiArrowDown,
  HiMiniChatBubbleLeftRight,
  HiMiniPlay,
  HiMiniStar,
} from "react-icons/hi2";
import {
  HiBookmark,
  HiOutlineBookmark,
  HiOutlineCollection,
  HiOutlineFilm,
} from "react-icons/hi";
import HeroTrailerBackground from "./HeroTrailerBackground";
import ContentMetadataPills from "./ContentMetadataPills";
import EpisodeDownloadMenu from "./EpisodeDownloadMenu";
import { useOptionalAuth } from "../../contexts/AuthContext";
import { sortCastByOrder } from "../../lib/cast-utils";
import { formatGregorianDate } from "../../lib/date-format";
import { resolveEpisodeTitle } from "../../lib/episode-title";
import { localizeGenreLabels } from "../../lib/genre-labels";
import type { PublicMovie } from "../../lib/movies";
import type {
  PublicSeries,
  PublicSeriesEpisode,
  PublicSeriesSeason,
} from "../../lib/series";
import { episodeHasDubbed, episodeHasSubtitle } from "../../lib/series";
import AuthRequiredDialog from "../auth/AuthRequiredDialog";
import RelatedContentSlider from "../catalog/RelatedContentSlider";
import CastSlider from "./CastSlider";
import SaveFeedbackToast from "./SaveFeedbackToast";
import {
  EpisodeStillImage,
  PosterImage,
} from "../images";
import {
  pickBackdropFromItem,
  pickPosterFromItem,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";
import ReviewsSection, {
  defaultReviewPaginator,
  defaultReviewSummary,
} from "../reviews/ReviewsSection";
import type { CatalogListItem } from "../../lib/catalog/rest";
import type { Review, ReviewSummary } from "../../lib/reviews";
import { isWatchlisted, toggleWatchlist } from "../../lib/watchlist";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";
import { useTvPageNavigation } from "../../hooks/useTvPageNavigation";
import {
  DETAIL_PLAY_FOCUS_KEY,
  isActivateKey,
  TV_CARD_FOCUS_CLASS,
  TV_FOCUS_RING_CLASS,
} from "../../lib/tv/focus";
import { ProgressTracker } from "../../features/player/services/ProgressTracker";

function seasonRowKey(season: Pick<PublicSeriesSeason, "id" | "season_number">): string {
  return season.id > 0 ? String(season.id) : `season-${season.season_number}`;
}

function episodeRowKey(episode: PublicSeriesEpisode): string {
  if (episode.id > 0) {
    return String(episode.id);
  }

  return `s${episode.season_number}-e${episode.episode_number}-${episode.slug}`;
}

type DetailTabKey = "details" | "similar" | "comments" | "episodes";
type ContentKind = "movie" | "series";

type CastRow = {
  name: string | null;
  character: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
  slug?: string | null;
};

function formatDuration(seconds: number | null, runtimeMinutes: number | null) {
  const totalSeconds =
    typeof seconds === "number" && seconds > 0
      ? seconds
      : typeof runtimeMinutes === "number" && runtimeMinutes > 0
        ? runtimeMinutes * 60
        : null;

  if (!totalSeconds) {
    return "نامشخص";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes} دقیقه`;
  }

  return `${hours} ساعت و ${minutes} دقیقه`;
}

function buildTabs(kind: ContentKind) {
  if (kind === "series") {
    return [
      { key: "details" as const, label: "اطلاعات سریال" },
      { key: "episodes" as const, label: "قسمت های سریال" },
      { key: "similar" as const, label: "سریال های مشابه" },
      { key: "comments" as const, label: "دیدگاه ها" },
    ];
  }

  return [
    { key: "details" as const, label: "اطلاعات فیلم" },
    { key: "similar" as const, label: "فیلم های مشابه" },
    { key: "comments" as const, label: "دیدگاه ها" },
  ];
}

function episodeWatchHref(seriesSlug: string, episode: PublicSeriesEpisode) {
  const params = new URLSearchParams({
    season: String(episode.season_number),
    episode: String(episode.episode_number),
  });

  return `/watch/${seriesSlug}?${params.toString()}`;
}

function episodeIsPlayable(episode: PublicSeriesEpisode): boolean {
  return Boolean(episode.hls_url?.trim() || episode.video_url?.trim());
}

function EpisodeGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`episode-card-skeleton-${index}`}
          className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03]"
        >
          <div className="aspect-video animate-pulse bg-white/8" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/8" />
            <div className="h-9 w-24 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CastSliderSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`cast-slider-skeleton-${index}`}
          className="w-32 shrink-0 space-y-3"
        >
          <div className="aspect-[2/3] animate-pulse rounded-2xl bg-white/8" />
          <div className="mx-auto h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="mx-auto h-3 w-16 animate-pulse rounded bg-white/8" />
        </div>
      ))}
    </div>
  );
}

export default function ContentDetailPage({
  kind,
  movie,
  series,
  similarItems,
  episodesLoading = false,
  similarLoading = false,
  castLoading = false,
  onRequestEpisodes,
  onRequestSimilar,
  reviewsProps,
}: {
  kind: ContentKind;
  movie?: PublicMovie | null;
  series?: PublicSeries | null;
  similarItems: CatalogListItem[];
  episodesLoading?: boolean;
  similarLoading?: boolean;
  castLoading?: boolean;
  onRequestEpisodes?: () => void;
  onRequestSimilar?: () => void;
  reviewsProps?: {
    initialReviews: Review[];
    initialSummary: ReviewSummary;
    initialPaginator: { currentPage: number; lastPage: number; total: number };
    userReview: Review | null;
    cachedAvgRating: number | null;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isTvCompat = useIsTvCompat();
  const pageRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLAnchorElement>(null);
  const { user, isAuthenticated, loading: authLoading } = useOptionalAuth();
  const [activeTab, setActiveTab] = useState<DetailTabKey>("details");
  const [watchlistVersion, setWatchlistVersion] = useState(0);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [saveToast, setSaveToast] = useState<{ message: string; saved: boolean } | null>(
    null,
  );
  const episodesFetchedRef = useRef(false);

  useEffect(() => {
    if (activeTab === "episodes" && kind === "series") {
      if (!episodesFetchedRef.current) {
        episodesFetchedRef.current = true;
        onRequestEpisodes?.();
      }
    }

    if (activeTab === "similar") {
      onRequestSimilar?.();
    }
  }, [activeTab, kind, onRequestEpisodes, onRequestSimilar]);

  const episodesGridRef = useRef<HTMLDivElement>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [episodeViewMode, setEpisodeViewMode] = useState<"grid" | "list">("grid");
  const [episodeSortAsc, setEpisodeSortAsc] = useState(true);

  useTvPageNavigation(pageRef, {
    enabled: isTvCompat,
    initialFocusRef: playButtonRef,
    autoFocus: isTvCompat,
  });

  const handlePlayNavigate = () => {
    if (typeof window !== "undefined" && pathname) {
      window.sessionStorage.setItem(DETAIL_PLAY_FOCUS_KEY, pathname);
    }
  };

  const navigateToEpisode = (episode: PublicSeriesEpisode) => {
    if (!episodeIsPlayable(episode) || !series?.slug) {
      return;
    }

    handlePlayNavigate();
    router.push(episodeWatchHref(series.slug, episode));
  };

  const handleEpisodeCardKeyDown = (
    event: React.KeyboardEvent,
    episode: PublicSeriesEpisode,
  ) => {
    if (isActivateKey(event.nativeEvent)) {
      event.preventDefault();
      navigateToEpisode(episode);
    }
  };

  const title = kind === "movie" ? movie?.title : series?.title;
  const slug = kind === "movie" ? movie?.slug : series?.slug;
  const contentId = kind === "movie" ? movie?.id : series?.id;
  const originalTitle = kind === "movie" ? movie?.original_title : series?.original_title;
  const synopsis = kind === "movie" ? movie?.synopsis : series?.synopsis;
  const releaseYear = kind === "movie" ? movie?.release_year : series?.release_year;
  const posterInput =
    kind === "movie"
      ? {
        poster_image: movie?.poster_image,
        poster_url: movie?.poster_url,
        backdrop_url: movie?.details.backdrop_url,
        backdrop_image: movie?.backdrop_image,
      }
      : {
        poster_image: series?.poster_image,
        poster_url: series?.poster_url,
        backdrop_url: series?.backdrop_url ?? series?.details.backdrop_url,
        backdrop_image: series?.backdrop_image,
      };
  const posterResolved = pickPosterFromItem(posterInput);
  const backdropResolved = pickBackdropFromItem({
    backdrop_image:
      kind === "movie" ? movie?.backdrop_image : series?.backdrop_image,
    backdrop_url:
      kind === "movie"
        ? movie?.details.backdrop_url ?? movie?.poster_url
        : series?.details.backdrop_url || series?.backdrop_url || series?.poster_url,
    poster_url: posterInput.poster_url,
  });
  const trailerUrl = kind === "movie" ? movie?.trailer_url : series?.trailer_url;
  const ageRating = kind === "movie" ? movie?.age_rating : series?.age_rating;
  const contentWarnings =
    kind === "movie" ? movie?.content_warnings : series?.content_warnings;
  const rawGenres =
    kind === "movie" ? movie?.details.genres || [] : series?.details.genres || [];
  const genres = localizeGenreLabels(rawGenres);
  const rating =
    kind === "movie" ? movie?.details.rating : series?.details.rating;
  const movieProducerLabel =
    kind === "movie"
      ? (
        movie?.provider_name ||
        movie?.details.network ||
        ""
      ).trim()
      : "";
  const seriesProducerLabel =
    kind === "series"
      ? (
        series?.provider_name ||
        series?.network ||
        series?.details.creators?.[0] ||
        ""
      ).trim()
      : "";
  const tabs = useMemo(() => buildTabs(kind), [kind]);

  useEffect(() => {
    if (!isTvCompat || !playButtonRef.current) {
      return;
    }

    const shouldFocusPlay =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(DETAIL_PLAY_FOCUS_KEY) === pathname;

    if (shouldFocusPlay) {
      window.sessionStorage.removeItem(DETAIL_PLAY_FOCUS_KEY);
    }

    const timer = window.setTimeout(() => {
      playButtonRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isTvCompat, pathname, title]);

  const castRows = useMemo((): CastRow[] => {
    if (kind === "movie" && movie) {
      const metadataActors = movie.details.actors ?? [];

      if (movie.cast?.length) {
        return sortCastByOrder(movie.cast)
          .filter((row) => row.name)
          .slice(0, 20)
          .map((row) => {
            const metadataActor = metadataActors.find((actor) => actor.name === row.name);

            if (
              row.profile_image?.original?.startsWith("/images/") ||
              row.profile_image?.src?.startsWith("/images/") ||
              row.profile_url?.startsWith("/images/")
            ) {
              return row;
            }

            if (!metadataActor) {
              return row;
            }

            return {
              ...row,
              profile_url: metadataActor.profile_url ?? row.profile_url,
              profile_image: metadataActor.profile_image ?? row.profile_image ?? null,
            };
          });
      }

      if (metadataActors.length) {
        return metadataActors.slice(0, 20).map((actor) => ({
          ...actor,
          slug: null,
        }));
      }

      return movie.cast_members.slice(0, 20).map((name) => ({
        name,
        character: null,
        profile_url: null,
        slug: null,
      }));
    }

    if (kind === "series" && series) {
      const metadataActors = series.details.actors ?? [];

      if (series.cast?.length) {
        return sortCastByOrder(series.cast)
          .filter((row) => row.name)
          .slice(0, 20)
          .map((row) => {
            const metadataActor = metadataActors.find((actor) => actor.name === row.name);

            if (
              row.profile_image?.original?.startsWith("/images/") ||
              row.profile_image?.src?.startsWith("/images/") ||
              row.profile_url?.startsWith("/images/")
            ) {
              return row;
            }

            if (!metadataActor) {
              return row;
            }

            return {
              ...row,
              profile_url: metadataActor.profile_url ?? row.profile_url,
              profile_image: metadataActor.profile_image ?? row.profile_image ?? null,
            };
          });
      }

      return metadataActors.slice(0, 20).map((actor) => ({
        ...actor,
        slug: null,
      }));
    }

    return [];
  }, [kind, movie, series]);

  const crewHighlights = useMemo(() => {
    if (kind === "movie" && movie) {
      return [
        {
          label: "کارگردان",
          value: (movie.details.directors ?? []).join("، ") || "ثبت نشده",
        },
        {
          label: "نویسنده",
          value: (movie.details.writers ?? []).join("، ") || "ثبت نشده",
        },
      ];
    }

    if (kind === "series" && series) {
      return [
        {
          label: "سازندگان",
          value: (series.details.creators ?? []).join("، ") || "ثبت نشده",
        },
        {
          label: "کارگردان",
          value: (series.details.directors ?? []).join("، ") || "ثبت نشده",
        },
        {
          label: "نویسنده",
          value: (series.details.writers ?? []).join("، ") || "ثبت نشده",
        },
        {
          label: "وضعیت",
          value: series.status_label_fa || series.status || "ثبت نشده",
        },
      ];
    }

    return [];
  }, [kind, movie, series]);

  const seasons = series?.seasons || [];
  const activeSeasonNumber =
    selectedSeasonNumber ?? seasons[0]?.season_number ?? null;
  const activeSeason =
    seasons.find((season) => season.season_number === activeSeasonNumber) ||
    seasons[0] ||
    null;

  useEffect(() => {
    if (!isTvCompat || activeTab !== "episodes" || episodesLoading || kind !== "series" || !series?.slug) {
      return;
    }

    const tracker = ProgressTracker.getInstance();
    const history = tracker.getAllHistory(true);
    const inProgress = history.find(
      (row) =>
        row.mediaType === "series" &&
        (row.seriesSlug === series.slug || row.slug === series.slug) &&
        !row.isCompleted &&
        row.percentWatched > 0 &&
        row.percentWatched < 95,
    );

    if (!inProgress?.seasonNumber || !inProgress.episodeNumber) {
      return;
    }

    setSelectedSeasonNumber(inProgress.seasonNumber);

    const timer = window.setTimeout(() => {
      const grid = episodesGridRef.current;

      if (!grid) {
        return;
      }

      const target = grid.querySelector<HTMLElement>(
        `[data-episode-season="${inProgress.seasonNumber}"][data-episode-number="${inProgress.episodeNumber}"]`,
      );

      target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      target?.focus();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeTab, activeSeasonNumber, episodesLoading, isTvCompat, kind, seasons.length, series?.slug]);

  const primaryWatchHref =
    kind === "movie" && movie
      ? `/watch/${movie.slug}`
      : kind === "series" && series
        ? (() => {
            const firstPlayable =
              activeSeason?.episodes.find((episode) => episodeIsPlayable(episode)) ??
              seasons
                .flatMap((season) => season.episodes || [])
                .find((episode) => episodeIsPlayable(episode));

            return firstPlayable
              ? episodeWatchHref(series.slug, firstPlayable)
              : `/watch/${series.slug}?season=${activeSeason?.season_number ?? 1}&episode=1`;
          })()
        : "#";

  const durationLabel =
    kind === "movie" && movie
      ? formatDuration(movie.duration_seconds, movie.details.runtime_minutes)
      : series?.episode_runtime_minutes
        ? `${series.episode_runtime_minutes} دقیقه هر قسمت`
        : "نامشخص";

  const countriesLabel = (
    kind === "movie" ? movie?.details.countries : series?.details.countries
  )?.join("، ");
  const hasSubtitle =
    kind === "movie"
      ? Boolean(movie?.has_subtitle || movie?.subtitle_source_url)
      : Boolean(
        series?.has_subtitle ||
        seasons.some((season) =>
          (season.episodes || []).some((episode) => episodeHasSubtitle(episode)),
        ),
      );
  const hasDubbedAudio =
    kind === "movie"
      ? Boolean(
        movie?.has_dubbed_audio ||
        movie?.audio_tracks?.some((track) => track.language === "fa"),
      )
      : Boolean(
        series?.has_dubbed ||
        seasons.some((season) =>
          (season.episodes || []).some((episode) => episodeHasDubbed(episode)),
        ),
      );

  const isSaved = useMemo(() => {
    void watchlistVersion;

    if (!isAuthenticated || !user || !contentId) {
      return false;
    }

    return isWatchlisted(user.id, kind, contentId);
  }, [isAuthenticated, user, contentId, kind, watchlistVersion]);

  const toggleSave = () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setShowAuthRequiredModal(true);
      return;
    }

    if (!contentId || !title || !slug) {
      return;
    }

    const result = toggleWatchlist(user.id, {
      kind,
      id: contentId,
      slug,
      title,
      poster_url: posterInput.poster_url,
      release_year: releaseYear,
    });

    setWatchlistVersion((current) => current + 1);
    setSaveToast({
      saved: result.saved,
      message: result.saved
        ? "به لیست «بعداً ببینم» اضافه شد."
        : "از لیست «بعداً ببینم» حذف شد.",
    });
  };

  const releaseYearLabel =
    releaseYear != null ? String(releaseYear) : null;
  const ageRatingLabel = ageRating?.trim() || null;

  if (!title || !slug) {
    return null;
  }

  return (
    <div ref={pageRef} className="bg-[#05070b] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <HeroTrailerBackground
          coverUrl={backdropResolved.src}
          coverImage={
            kind === "movie" ? movie?.backdrop_image : series?.backdrop_image
          }
          trailerUrl={trailerUrl ?? null}
          alt={title}
        />
        <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(5,7,11,0.15)_0%,rgba(5,7,11,0.55)_42%,rgba(5,7,11,0.94)_72%,rgba(5,7,11,0.98)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.15)_0%,rgba(5,7,11,0.35)_55%,rgba(5,7,11,0.96)_100%)]" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <div className="mx-auto grid w-full max-w-[1820px] flex-1 items-end gap-8 px-4 pb-16 pt-28 md:px-7 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-12">
            {posterResolved.src ? (
              <div className="mx-auto w-full max-w-[280px] lg:mx-0">
                <div className="relative aspect-[2/3] overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
                  <PosterImage
                    title={title}
                    image={
                      kind === "movie" ? movie?.poster_image : series?.poster_image
                    }
                    src={posterResolved.src}
                    fallbackUrl={posterInput.backdrop_url}
                    usage="detail-poster"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={toggleSave}
                    disabled={authLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-white/8 bg-white/8 px-4 text-sm font-semibold text-white transition hover:bg-white/12 disabled:cursor-wait disabled:opacity-60"
                    aria-label={isSaved ? "حذف از لیست ذخیره" : "ذخیره محتوا"}
                  >
                    {isSaved ? (
                      <HiBookmark className="h-8 w-8 text-[#f5c518]" />
                    ) : (
                      <HiOutlineBookmark className="h-8 w-8" />
                    )}
                    <span>{isSaved ? "ذخیره شده" : "ذخیره"}</span>
                  </button>
                  <InfoPill
                    icon={<HiOutlineFilm className="h-5 w-5" />}
                    label={kind === "series" ? "فصل‌ها" : "مدت زمان"}
                    value={
                      kind === "series"
                        ? `${series?.number_of_seasons || seasons.length || 0} فصل`
                        : durationLabel
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="min-w-0 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <h1 className="text-4xl font-black leading-tight md:text-6xl">{title}</h1>
                  {releaseYearLabel || ageRatingLabel ? (
                    <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-white/58 md:text-xl">
                      {releaseYearLabel ? (
                        <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 pt-1.5">
                          {releaseYearLabel}
                        </span>
                      ) : null}
                      {ageRatingLabel ? (
                        <span className="rounded-full border border-[#f97316]/35 bg-[#f97316]/12 text-[#fdba74] h-[40px] flex items-center justify-center px-3 pt-0.5">
                          {ageRatingLabel}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <ContentMetadataPills contentWarnings={contentWarnings} />
                </div>
              </div>

              {originalTitle ? (
                <p className="text-lg text-white/56">{originalTitle}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {(
                  kind === "movie" && movie?.genres?.length
                    ? movie.genres.map((genre) => ({
                      id: genre.id,
                      label: genre.name,
                    }))
                    : kind === "series" && series?.genres?.length
                      ? series.genres.map((genre) => ({
                        id: genre.id,
                        label: genre.name,
                      }))
                      : []
                )
                  .slice(0, 4)
                  .map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/${kind === "movie" ? "movies" : "series"}?genre_ids=${genre.id}`}
                      className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-sm text-white/88 backdrop-blur transition hover:border-[#2563eb]/50 hover:bg-[#2563eb]/20"
                    >
                      {genre.label}
                    </Link>
                  ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-white/84">
                <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1.5">
                  کشور: {countriesLabel || "نامشخص"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {rating ? (
                  <span className="rounded-full bg-[#eab308] px-3 py-1.5 pt-2 text-sm font-black text-black">
                    IMDb {rating.toFixed(1)}
                  </span>
                ) : null}
                {kind === "movie" && movieProducerLabel ? (
                  <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
                    سازنده: {movieProducerLabel}
                  </span>
                ) : null}
                {kind === "series" && seriesProducerLabel ? (
                  <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
                    سازنده: {seriesProducerLabel}
                  </span>
                ) : null}
                {kind === "series" && series?.status_label_fa ? (
                  <span className="rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/15 px-3 py-1.5 text-sm text-[#7dd3fc]">
                    {series.status_label_fa}
                  </span>
                ) : null}

                {hasSubtitle ? (
                  <span className="rounded-lg border border-[#f5c518]/30 bg-[#f5c518]/10 px-2.5 py-1.5 text-sm font-semibold text-[#f8d977] backdrop-blur">
                    زیرنویس فارسی
                  </span>
                ) : null}
                {hasDubbedAudio ? (
                  <span className="rounded-lg border border-[#f5c518]/30 bg-[#f5c518]/10 px-2.5 py-1.5 text-sm font-semibold text-[#f8d977] backdrop-blur">
                    دوبله فارسی
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  ref={playButtonRef}
                  href={primaryWatchHref}
                  prefetch
                  data-tv-focusable
                  onClick={handlePlayNavigate}
                  className={`inline-flex items-center gap-3 rounded-2xl bg-[#f5c518] px-8 py-4 text-lg font-black text-[#12100a] shadow-[0_24px_50px_rgba(245,197,24,0.22)] transition hover:bg-[#e8bb0d] ${TV_FOCUS_RING_CLASS}`}
                >
                  {kind === "series" ? "تماشای قسمت ۱" : "تماشا کنید"}
                  <HiMiniPlay className="h-6 w-6" />
                </Link>

                {kind === "movie" &&
                  movie?.download_links &&
                  Object.keys(movie.download_links).length > 0 ? (
                  <EpisodeDownloadMenu downloadLinks={movie.download_links} align="right" />
                ) : null}

              </div>
            </div>
          </div>

          <a
            href="#details-tabs"
            className="absolute bottom-10 left-1/2 inline-flex -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 p-3 text-white/80 backdrop-blur transition hover:text-white"
            aria-label="رفتن به جزئیات"
          >
            <HiArrowDown className="h-5 w-5" />
          </a>
        </div>
      </section>

      <AuthRequiredDialog
        open={showAuthRequiredModal}
        onClose={() => setShowAuthRequiredModal(false)}
        redirectPath={pathname}
        title="برای ذخیره، ابتدا عضو شوید"
        description="برای افزودن این عنوان به لیست «بعداً ببینم» باید ابتدا در سایت ثبت‌نام کنید یا وارد حساب کاربری خود شوید."
        featureLabel="ذخیره فیلم و سریال"
      />

      {saveToast ? (
        <SaveFeedbackToast
          message={saveToast.message}
          saved={saveToast.saved}
          onDismiss={() => setSaveToast(null)}
        />
      ) : null}

      <section
        id="details-tabs"
        className="relative z-20 mx-auto w-full max-w-[1820px] px-4 pb-20 pt-8 md:px-7"
      >
        <div className="sticky top-[126px] z-30 border-b border-white/10 bg-[#05070b]/95 backdrop-blur-xl xl:top-[92px]">
          <div
            className="flex flex-wrap items-center gap-6 overflow-x-auto py-5 text-sm md:text-base"
            data-tv-focus-group="tabs"
            role="tablist"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                data-tv-focusable
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 pb-3 font-semibold transition ${TV_FOCUS_RING_CLASS} ${
                  activeTab === tab.key
                    ? "border-[#f5c518] text-[#f8d977]"
                    : "border-transparent text-white/72 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "details" ? (
          <div className="space-y-16 pt-10">
            <section className="rounded-[34px] border border-white/8 bg-white/[0.03] p-6 md:p-8">
              <SectionTitle icon={<HiMiniStar className="h-5 w-5" />}>
                خلاصه داستان
              </SectionTitle>
              <p className="mt-5 text-base leading-9 text-white/82 md:text-lg">
                {synopsis ||
                  `برای این ${kind === "series" ? "سریال" : "فیلم"} هنوز خلاصه‌ای ثبت نشده است.`}
              </p>
            </section>

            {castLoading ? <CastSliderSkeleton /> : <CastSlider cast={castRows} />}

            <section className="space-y-7">
              <SectionTitle icon={<HiOutlineCollection className="h-5 w-5" />}>
                {kind === "series" ? "عوامل سریال" : "عوامل فیلم"}
              </SectionTitle>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {crewHighlights.map((item) => (
                  <InfoCard key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "episodes" && kind === "series" && series ? (
          <div className="space-y-8 pt-10">
            {episodesLoading ? (
              <EpisodeGridSkeleton />
            ) : seasons.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {seasons.map((season) => (
                      <button
                        key={seasonRowKey(season)}
                        type="button"
                        data-tv-focusable
                        onClick={() => setSelectedSeasonNumber(season.season_number)}
                        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${TV_FOCUS_RING_CLASS} ${
                          activeSeason?.season_number === season.season_number
                            ? "bg-[#f5c518] text-[#12100a]"
                            : "border border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                        }`}
                      >
                        فصل {season.season_number}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEpisodeSortAsc((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/75 transition hover:bg-white/[0.08]"
                      title={episodeSortAsc ? "قدیمی‌ترین اول" : "جدیدترین اول"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition ${episodeSortAsc ? "" : "rotate-180"}`}><path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h11.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zM2 7.5a.75.75 0 01.75-.75h7.508a.75.75 0 010 1.5H2.75A.75.75 0 012 7.5zM14 7a.75.75 0 01.75.75v6.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V7.75A.75.75 0 0114 7zM2 11.25a.75.75 0 01.75-.75h4.562a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                      مرتب‌سازی
                    </button>
                    <button
                      type="button"
                      onClick={() => setEpisodeViewMode("grid")}
                      className={`inline-flex items-center justify-center rounded-full p-2.5 transition ${episodeViewMode === "grid" ? "bg-[#f5c518] text-[#12100a]" : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"}`}
                      title="نمایش شبکه‌ای"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEpisodeViewMode("list")}
                      className={`inline-flex items-center justify-center rounded-full p-2.5 transition ${episodeViewMode === "list" ? "bg-[#f5c518] text-[#12100a]" : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"}`}
                      title="نمایش لیستی"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                {episodeViewMode === "grid" ? (
                  <div
                    ref={episodesGridRef}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    data-tv-grid="episodes"
                  >
                    {(activeSeason?.episodes || [])
                      .slice()
                      .sort((a, b) =>
                        episodeSortAsc
                          ? a.episode_number - b.episode_number
                          : b.episode_number - a.episode_number,
                      )
                      .map((episode) => {
                        const episodeTitle =
                          resolveEpisodeTitle([episode.title], episode.episode_number) ||
                          `قسمت ${episode.episode_number}`;

                        return (
                          <div
                            key={episodeRowKey(episode)}
                            data-tv-focusable
                            data-tv-grid-item
                            data-episode-season={episode.season_number}
                            data-episode-number={episode.episode_number}
                            data-episode-key={episodeRowKey(episode)}
                            tabIndex={0}
                            onClick={() => navigateToEpisode(episode)}
                            onKeyDown={(event) => handleEpisodeCardKeyDown(event, episode)}
                            className={`group overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] transition hover:border-white/14 hover:bg-white/[0.05] focus-within:border-[#38bdf8]/50 focus-within:bg-white/[0.05] ${TV_FOCUS_RING_CLASS}`}
                          >
                            <div className="relative aspect-video overflow-hidden bg-white/5">
                              <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]">
                                {episode.still_url || episode.still_image ? (
                                  <EpisodeStillImage
                                    seriesTitle={title}
                                    seasonNumber={episode.season_number}
                                    episodeNumber={episode.episode_number}
                                    image={episode.still_image}
                                    src={episode.still_url}
                                    usage="episode-card"
                                    sizes="(max-width: 768px) 100vw, 25vw"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-sm text-white/30">
                                    E{episode.episode_number}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                              </div>
                              {episodeIsPlayable(episode) ? (
                                <Link
                                  href={episodeWatchHref(series.slug, episode)}
                                  data-tv-focusable
                                  className={`absolute inset-0 z-10 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 ${TV_CARD_FOCUS_CLASS}`}
                                >
                                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f5c518] text-[#12100a] shadow-lg">
                                    <HiMiniPlay className="h-5 w-5" />
                                  </span>
                                </Link>
                              ) : null}
                              <div className="pointer-events-none absolute bottom-2 right-2 z-20 flex gap-1.5">
                                {episodeHasSubtitle(episode) ? (
                                  <span className="rounded-md border border-[#f5c518]/30 bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[#f8d977]">
                                    زیرنویس
                                  </span>
                                ) : null}
                                {episodeHasDubbed(episode) ? (
                                  <span className="rounded-md border border-[#f5c518]/30 bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[#f8d977]">
                                    دوبله
                                  </span>
                                ) : null}
                              </div>
                              <span className="pointer-events-none absolute top-2 left-2 z-20 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white/80">
                                E{String(episode.episode_number).padStart(2, "0")}
                              </span>
                            </div>
                            <div className="space-y-2 p-4">
                              <h3 className="line-clamp-1 text-sm font-bold text-white">
                                {episodeTitle}
                              </h3>
                              <p className="text-xs text-white/45">
                                {episode.duration_minutes ? `${episode.duration_minutes} دقیقه` : ""}
                                {episode.air_date ? ` • ${formatGregorianDate(episode.air_date)}` : ""}
                              </p>
                              {episode.synopsis ? (
                                <p className="line-clamp-2 text-xs leading-5 text-white/50">
                                  {episode.synopsis}
                                </p>
                              ) : null}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                {episodeIsPlayable(episode) ? (
                                  <Link
                                    href={episodeWatchHref(series.slug, episode)}
                                    data-tv-focusable
                                    onClick={handlePlayNavigate}
                                    className={`inline-flex items-center gap-1.5 rounded-xl bg-[#f5c518] px-4 py-2 text-xs font-bold text-[#12100a] transition hover:bg-[#e8bb0d] ${TV_FOCUS_RING_CLASS}`}
                                  >
                                    <HiMiniPlay className="h-3.5 w-3.5" />
                                    پخش
                                  </Link>
                                ) : (
                                  <span className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/40">
                                    به زودی
                                  </span>
                                )}
                                {episode.download_links &&
                                  Object.keys(episode.download_links).length > 0 ? (
                                  <EpisodeDownloadMenu
                                    downloadLinks={episode.download_links}
                                    align="right"
                                  />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(activeSeason?.episodes || [])
                      .slice()
                      .sort((a, b) =>
                        episodeSortAsc
                          ? a.episode_number - b.episode_number
                          : b.episode_number - a.episode_number,
                      )
                      .map((episode) => {
                        const episodeTitle =
                          resolveEpisodeTitle([episode.title], episode.episode_number) ||
                          `قسمت ${episode.episode_number}`;

                        return (
                          <div
                            key={episodeRowKey(episode)}
                            data-tv-focusable
                            data-episode-season={episode.season_number}
                            data-episode-number={episode.episode_number}
                            data-episode-key={episodeRowKey(episode)}
                            tabIndex={episodeIsPlayable(episode) ? 0 : undefined}
                            onClick={() => navigateToEpisode(episode)}
                            onKeyDown={(event) => handleEpisodeCardKeyDown(event, episode)}
                            className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.045] focus-within:border-[#38bdf8]/50 md:flex-row md:items-center"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              {episode.still_url || episode.still_image ? (
                                <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                                  <EpisodeStillImage
                                    seriesTitle={title}
                                    seasonNumber={episode.season_number}
                                    episodeNumber={episode.episode_number}
                                    image={episode.still_image}
                                    src={episode.still_url}
                                    usage="episode-card"
                                    sizes="160px"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-sm text-white/40">
                                  E{episode.episode_number}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-white/45">
                                  فصل {episode.season_number} • قسمت {episode.episode_number}
                                  {episode.duration_minutes ? ` • ${episode.duration_minutes} دقیقه` : ""}
                                </p>
                                <h3 className="mt-1 text-lg font-bold leading-8 text-white">
                                  {episodeTitle}
                                </h3>
                                {episode.synopsis ? (
                                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/55">
                                    {episode.synopsis}
                                  </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {episodeHasSubtitle(episode) ? (
                                    <span className="rounded-md border border-[#f5c518]/25 bg-[#f5c518]/10 px-2 py-0.5 text-[10px] font-bold text-[#f8d977]">
                                      زیرنویس
                                    </span>
                                  ) : null}
                                  {episodeHasDubbed(episode) ? (
                                    <span className="rounded-md border border-[#f5c518]/25 bg-[#f5c518]/10 px-2 py-0.5 text-[10px] font-bold text-[#f8d977]">
                                      دوبله
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {episodeIsPlayable(episode) ? (
                                <>
                                  {episode.download_links &&
                                    Object.keys(episode.download_links).length > 0 ? (
                                    <EpisodeDownloadMenu downloadLinks={episode.download_links} />
                                  ) : null}
                                  <Link
                                    href={episodeWatchHref(series.slug, episode)}
                                    onClick={handlePlayNavigate}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#f5c518] px-6 py-3 text-sm font-bold text-[#12100a] transition hover:bg-[#e8bb0d]"
                                  >
                                    پخش
                                    <HiMiniPlay className="h-4 w-4" />
                                  </Link>
                                </>
                              ) : (
                                <span className="inline-flex shrink-0 rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/45">
                                  به زودی
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center text-white/45">
                هنوز قسمتی برای این سریال ثبت نشده است.
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "similar" ? (
          <div className="pt-10">
            <RelatedContentSlider
              title={kind === "series" ? "سریال‌های مشابه" : "فیلم‌های مشابه"}
              kind={kind}
              loading={similarLoading}
              items={similarItems}
            />
          </div>
        ) : null}

        {activeTab === "comments" && slug ? (
          <div className="pt-10">
            <ReviewsSection
              contentType={kind}
              slug={slug}
              initialReviews={reviewsProps?.initialReviews ?? []}
              initialSummary={reviewsProps?.initialSummary ?? defaultReviewSummary()}
              initialPaginator={reviewsProps?.initialPaginator ?? defaultReviewPaginator()}
              userReview={reviewsProps?.userReview ?? null}
              cachedAvgRating={reviewsProps?.cachedAvgRating ?? null}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5c518]/12 text-[#f87171]">
        {icon}
      </span> */}
      <h2 className="text-2xl font-black text-white md:text-[2rem]">{children}</h2>
    </div>
  );
}

function InfoPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-white/45">{label}</span>
        <span className="text-white/38">{icon}</span>
      </div>
      <p className="mt-3 text-base font-bold text-white">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
      <p className="text-sm text-white/42">{label}</p>
      <p className="mt-3 text-base font-bold leading-8 text-white">{value}</p>
    </div>
  );
}
