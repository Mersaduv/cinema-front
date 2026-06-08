"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  HiOutlineUserGroup,
} from "react-icons/hi";
import HeroTrailerBackground from "./HeroTrailerBackground";
import EpisodeDownloadMenu from "./EpisodeDownloadMenu";
import { useAuth } from "../../contexts/AuthContext";
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
import RelatedContentCarousel from "../catalog/RelatedContentCarousel";
import ReviewsSection, {
  defaultReviewPaginator,
  defaultReviewSummary,
} from "../reviews/ReviewsSection";
import type { CatalogListItem } from "../../lib/catalog/rest";
import type { Review, ReviewSummary } from "../../lib/reviews";

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
  slug?: string | null;
};

type SimilarItem = {
  id: number;
  title: string;
  slug: string;
  synopsis: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  details: {
    genres: string[];
    backdrop_url?: string | null;
  };
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

function normalizeImageCandidates(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
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

export default function ContentDetailPage({
  kind,
  movie,
  series,
  similarItems,
  episodesLoading = false,
  similarLoading = false,
  onRequestEpisodes,
  onRequestSimilar,
  reviewsProps,
}: {
  kind: ContentKind;
  movie?: PublicMovie | null;
  series?: PublicSeries | null;
  similarItems: SimilarItem[];
  episodesLoading?: boolean;
  similarLoading?: boolean;
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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<DetailTabKey>("details");
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);

  useEffect(() => {
    if (activeTab === "episodes" && kind === "series") {
      onRequestEpisodes?.();
    }

    if (activeTab === "similar") {
      onRequestSimilar?.();
    }
  }, [activeTab, kind, onRequestEpisodes, onRequestSimilar]);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [episodeViewMode, setEpisodeViewMode] = useState<"grid" | "list">("grid");
  const [episodeSortAsc, setEpisodeSortAsc] = useState(true);

  const title = kind === "movie" ? movie?.title : series?.title;
  const slug = kind === "movie" ? movie?.slug : series?.slug;
  const originalTitle = kind === "movie" ? movie?.original_title : series?.original_title;
  const synopsis = kind === "movie" ? movie?.synopsis : series?.synopsis;
  const releaseYear = kind === "movie" ? movie?.release_year : series?.release_year;
  const posterUrl = kind === "movie" ? movie?.poster_url : series?.poster_url;
  const trailerUrl = kind === "movie" ? movie?.trailer_url : series?.trailer_url;
  const ageRating = kind === "movie" ? movie?.age_rating : series?.age_rating;
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
  const backdropUrl =
    kind === "movie"
      ? movie?.details.backdrop_url ?? movie?.poster_url ?? null
      : series?.details.backdrop_url || series?.backdrop_url || series?.poster_url;

  const tabs = useMemo(() => buildTabs(kind), [kind]);

  const castRows = useMemo((): CastRow[] => {
    if (kind === "movie" && movie) {
      if (movie.cast?.length) {
        return sortCastByOrder(movie.cast)
          .filter((row) => row.name)
          .slice(0, 20);
      }
      if ((movie.details.actors ?? []).length) {
        return (movie.details.actors ?? []).slice(0, 20).map((actor) => ({
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
      if (series.cast?.length) {
        return sortCastByOrder(series.cast)
          .filter((row) => row.name)
          .slice(0, 20);
      }
      return (series.details.actors ?? []).slice(0, 20).map((actor) => ({
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
        {
          label: "زبان‌ها",
          value: (movie.details.languages ?? []).join("، ") || "ثبت نشده",
        },
        {
          label: "کشورها",
          value: (movie.details.countries ?? []).join("، ") || "ثبت نشده",
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

  const galleryImages = useMemo(() => {
    if (kind === "movie" && movie) {
      return normalizeImageCandidates([
        ...(movie.details.gallery || []),
        movie.details.backdrop_url,
        movie.poster_url,
      ]);
    }

    if (kind === "series" && series) {
      return normalizeImageCandidates([
        ...(series.details.gallery || []),
        series.details.backdrop_url,
        series.backdrop_url,
        series.poster_url,
      ]);
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

  const primaryWatchHref =
    kind === "movie" && movie
      ? `/watch/${movie.slug}`
      : kind === "series" && series && activeSeason?.episodes[0]
        ? episodeWatchHref(series.slug, activeSeason.episodes[0])
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
  const languageItems =
    kind === "movie"
      ? movie?.details.languages?.length
        ? movie.details.languages
        : movie?.details.original_language
          ? [movie.details.original_language]
          : []
      : series?.details.languages?.length
        ? series.details.languages
        : series?.details.original_language
          ? [series.details.original_language]
          : [];
  const hasSubtitle =
    kind === "movie"
      ? Boolean(movie?.has_subtitle || movie?.subtitle_source_url)
      : Boolean(
          series?.has_subtitle ||
            seasons.some((season) =>
              (season.episodes || []).some((episode) => Boolean(episode.subtitle_url)),
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
              (season.episodes || []).some((episode) => Boolean(episode.dubbed_audio_url)),
            ),
        );

  const toggleSave = () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setShowAuthRequiredModal(true);
      return;
    }

    setIsSaved((current) => !current);
  };

  if (!title || !slug) {
    return null;
  }

  return (
    <div className="bg-[#05070b] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <HeroTrailerBackground
          coverUrl={backdropUrl ?? null}
          trailerUrl={trailerUrl ?? null}
          alt={title}
        />
        <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(5,7,11,0.15)_0%,rgba(5,7,11,0.55)_42%,rgba(5,7,11,0.94)_72%,rgba(5,7,11,0.98)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.15)_0%,rgba(5,7,11,0.35)_55%,rgba(5,7,11,0.96)_100%)]" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <div className="mx-auto grid w-full max-w-[1820px] flex-1 items-end gap-8 px-4 pb-16 pt-28 md:px-7 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-12">
            {posterUrl ? (
              <div className="mx-auto w-full max-w-[280px] lg:mx-0">
                <div className="relative aspect-[2/3] overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 280px, 300px"
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={toggleSave}
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-white/8 bg-white/8 px-4 text-sm font-semibold text-white transition hover:bg-white/12"
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
              <h1 className="text-4xl font-black leading-tight md:text-6xl">{title}</h1>

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

              <div className="flex flex-wrap items-center gap-2 text-sm text-white/84">
                <span className="text-white/62">زبان:</span>
                {languageItems.length > 0 ? (
                  languageItems.map((lang) => (
                    <span
                      key={`language-${lang}`}
                      className="rounded-full border border-white/12 bg-black/30 px-3 py-1.5"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1.5">
                    نامشخص
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {rating ? (
                  <span className="rounded-full bg-[#eab308] px-3 py-1.5 text-sm font-black text-black">
                    IMDb {rating.toFixed(1)}
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
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-white/78 md:text-base">
                <span className="rounded-full bg-white/8 px-4 py-2">
                  {releaseYear || "سال نامشخص"}
                </span>
                <span className="rounded-full bg-[#f97316]/18 px-4 py-2 text-[#fdba74]">
                  {ageRating || "16+"}
                </span>
              </div>

              <div className="mt-8 max-w-3xl text-base leading-8 text-white/78 md:text-lg">
                {synopsis || `برای این ${kind === "series" ? "سریال" : "فیلم"} هنوز خلاصه‌ای ثبت نشده است.`}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={primaryWatchHref}
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#ef4444] px-8 py-4 text-lg font-black text-white shadow-[0_24px_50px_rgba(239,68,68,0.28)] transition hover:bg-[#dc2626]"
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

      {showAuthRequiredModal ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#090d12] p-6 text-right shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-black text-white">نیاز به ورود</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              لطفاً برای دسترسی به این بخش ابتدا وارد حساب کاربری تان شوید.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href={`/login${pathname ? `?redirect=${encodeURIComponent(pathname)}` : ""}`}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#f5c518] px-4 py-3 text-sm font-black text-[#081018] transition hover:bg-[#e8bb0d]"
              >
                ورود
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthRequiredModal(false)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                انصراف
              </button>
            </div>
            <p className="mt-4 text-sm text-white/60">
              حساب کاربری ندارید؟
              <Link
                href={`/signup${pathname ? `?redirect=${encodeURIComponent(pathname)}` : ""}`}
                className="mr-1 text-[#f5c518] transition hover:text-[#f8d977]"
              >
                ثبت نام
              </Link>
            </p>
          </div>
        </div>
      ) : null}

      <section
        id="details-tabs"
        className="relative z-20 mx-auto w-full max-w-[1820px] px-4 pb-20 pt-8 md:px-7"
      >
        <div className="sticky top-[126px] z-30 border-b border-white/10 bg-[#05070b]/95 backdrop-blur-xl xl:top-[92px]">
          <div className="flex flex-wrap items-center gap-6 overflow-x-auto py-5 text-sm md:text-base">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 pb-3 font-semibold transition ${
                  activeTab === tab.key
                    ? "border-[#ef4444] text-[#ef4444]"
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

           

            <section className="space-y-7">
              <SectionTitle icon={<HiOutlineUserGroup className="h-5 w-5" />}>
                {kind === "series" ? "بازیگران سریال" : "بازیگران فیلم"}
              </SectionTitle>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {castRows.map((actor, index) => {
                  const inner = (
                    <>
                      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/8">
                        {actor.profile_url ? (
                          <Image
                            src={actor.profile_url}
                            alt={actor.name || "actor"}
                            width={96}
                            height={96}
                            className="h-24 w-24 object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-black text-white/55">
                            {(actor.name || title).charAt(0)}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-bold text-white">
                        {actor.name || "بازیگر"}
                      </h3>
                      <p className="mt-1 text-sm text-white/42">
                        {actor.character ? `در نقش ${actor.character}` : "نقش ثبت نشده"}
                      </p>
                    </>
                  );

                  return (
                    <div
                      key={`${actor.name || "actor"}-${index}`}
                      className="rounded-[30px] border border-white/8 bg-white/[0.03] p-4 text-center"
                    >
                      {actor.slug ? (
                        <Link
                          href={`/actors/${actor.slug}`}
                          className="block text-inherit no-underline"
                        >
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

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

            <section className="space-y-7">
              <SectionTitle icon={<HiOutlineFilm className="h-5 w-5" />}>
                پیش نمایش و عکس‌ها
              </SectionTitle>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {galleryImages.length > 0 ? (
                  galleryImages.slice(0, 4).map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-white/8 bg-white/5"
                    >
                      <Image
                        src={image}
                        alt={`${title} gallery ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition duration-500 hover:scale-105"
                      />
                    </div>
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-12 text-center text-white/45 md:col-span-2 xl:col-span-4">
                    هنوز تصویری برای این بخش ثبت نشده است.
                  </div>
                )}
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
                        onClick={() => setSelectedSeasonNumber(season.season_number)}
                        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                          activeSeason?.season_number === season.season_number
                            ? "bg-[#ef4444] text-white"
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
                      className={`inline-flex items-center justify-center rounded-full p-2.5 transition ${episodeViewMode === "grid" ? "bg-[#ef4444] text-white" : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"}`}
                      title="نمایش شبکه‌ای"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEpisodeViewMode("list")}
                      className={`inline-flex items-center justify-center rounded-full p-2.5 transition ${episodeViewMode === "list" ? "bg-[#ef4444] text-white" : "border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"}`}
                      title="نمایش لیستی"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                {episodeViewMode === "grid" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                            className="group overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] transition hover:border-white/14 hover:bg-white/[0.05]"
                          >
                            <div className="relative aspect-video overflow-hidden bg-white/5">
                              <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]">
                                {episode.still_url ? (
                                  <Image
                                    src={episode.still_url}
                                    alt={episodeTitle}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 25vw"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-sm text-white/30">
                                    E{episode.episode_number}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                              </div>
                              {episode.hls_url ? (
                                <Link
                                  href={episodeWatchHref(series.slug, episode)}
                                  className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition group-hover:opacity-100"
                                >
                                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ef4444] text-white shadow-lg">
                                    <HiMiniPlay className="h-5 w-5" />
                                  </span>
                                </Link>
                              ) : null}
                              <div className="pointer-events-none absolute bottom-2 right-2 z-20 flex gap-1.5">
                                {episode.subtitle_url ? (
                                  <span className="rounded-md border border-[#f5c518]/30 bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[#f8d977]">
                                    زیرنویس
                                  </span>
                                ) : null}
                                {episode.dubbed_audio_url ? (
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
                                {episode.hls_url ? (
                                  <Link
                                    href={episodeWatchHref(series.slug, episode)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#ef4444] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#dc2626]"
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
                            className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.045] md:flex-row md:items-center"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              {episode.still_url ? (
                                <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                                  <Image
                                    src={episode.still_url}
                                    alt={episodeTitle}
                                    fill
                                    sizes="160px"
                                    className="object-cover"
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
                                  {episode.subtitle_url ? (
                                    <span className="rounded-md border border-[#f5c518]/25 bg-[#f5c518]/10 px-2 py-0.5 text-[10px] font-bold text-[#f8d977]">
                                      زیرنویس
                                    </span>
                                  ) : null}
                                  {episode.dubbed_audio_url ? (
                                    <span className="rounded-md border border-[#f5c518]/25 bg-[#f5c518]/10 px-2 py-0.5 text-[10px] font-bold text-[#f8d977]">
                                      دوبله
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {episode.hls_url ? (
                                <>
                                  {episode.download_links &&
                                  Object.keys(episode.download_links).length > 0 ? (
                                    <EpisodeDownloadMenu downloadLinks={episode.download_links} />
                                  ) : null}
                                  <Link
                                    href={episodeWatchHref(series.slug, episode)}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#dc2626]"
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
            <RelatedContentCarousel
              title={kind === "series" ? "سریال‌های مشابه" : "فیلم‌های مشابه"}
              kind={kind}
              loading={similarLoading}
              items={similarItems.map(
                (candidate): CatalogListItem => ({
                  id: candidate.id,
                  title: candidate.title,
                  slug: candidate.slug,
                  synopsis: candidate.synopsis,
                  release_year: candidate.release_year,
                  poster_url: candidate.poster_url,
                  backdrop_url: candidate.backdrop_url,
                  rating: null,
                  details: {
                    genres: candidate.details.genres,
                    backdrop_url: candidate.details.backdrop_url ?? candidate.backdrop_url,
                  },
                }),
              )}
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
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ef4444]/12 text-[#f87171]">
        {icon}
      </span>
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
