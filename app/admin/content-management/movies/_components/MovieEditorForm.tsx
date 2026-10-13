"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineVideoCamera,
  HiOutlineVolumeUp,
  HiOutlineX,
} from "react-icons/hi";
import AdminScheduleDateTimePicker from "../../../../components/admin/AdminScheduleDateTimePicker";
import AdminSelect from "../../../../components/admin/AdminSelect";
import EditorPublishSubmitBar from "../../../../components/admin/EditorPublishSubmitBar";
import MovieFormStatusPanel from "../../../../components/admin/MovieFormStatusPanel";
import TmdbTitleSearch from "../../../../components/admin/TmdbTitleSearch";
import PlaybackSubtitleDubFields from "../../_components/PlaybackSubtitleDubFields";
import FormFieldAnchor from "../../_components/FormFieldAnchor";
import {
  formFieldBorderClass,
  issuesToErrorMap,
  scrollToFormField,
} from "../../_lib/admin-form-tab-validation";
import {
  validateMovieDetailsTab,
  validateMovieMediaTab,
  validateMovieTab,
} from "../../_lib/movie-tab-validation";
import {
  resolveContentEntryMode,
  type ContentEntryMode,
} from "../../_lib/content-entry-mode";
import ContentEntryModeToggle from "../../_components/ContentEntryModeToggle";
import SeoFieldsPanel from "../../../../components/admin/SeoFieldsPanel";
import {
  ContentWarningsField,
  ExternalIdsSection,
} from "../../../../components/admin/ContentMetadataFormFields";
import PublishOutcomeModal, {
  type PublishOutcomeStatus,
} from "../../../../components/admin/PublishOutcomeModal";
import TmdbPreviewSkeleton from "../../../../components/admin/TmdbPreviewSkeleton";
import { BackdropImage, PosterImage } from "../../../../components/images";
import AdminImageUrlField from "../../_components/AdminImageUrlField";

import { sortCastByOrder, sortCastRows } from "../../../../lib/cast-utils";
import { isProgressiveVideoUrl } from "../../../../features/player/utils/format";
import {
  filterLatinPersonNameList,
  isLatinPersonName,
  resolveLatinPersonName,
  sanitizeLatinPersonName,
} from "../../../../lib/person-name";
import { revalidateAdminMoviesList } from "../../../../lib/admin-movies-revalidate";
import { revalidatePublicMoviePages } from "../../../../lib/catalog/revalidate";
import {
  adminMoviesService,
  mergeMovieFromSaveResponse,
  type AdminMovie,
  type PublishStatus,
  type TmdbActor,
  type TmdbBelongsToCollection,
  type TmdbMoviePayload,
} from "../../../../lib/admin-movies";
import { apiDateTimeToInputValue, toDateTimeInputValue } from "../../../../lib/date-format";
import {
  mergeSeasonEpisodeSynopsisFromTmdb,
  normalizeSeasonEpisodeSynopsis,
  resolveTmdbMainSynopsis,
} from "../../../../lib/series-synopsis-helper";
import { normalizeListItemLabel, normalizeStringList } from "../../../../lib/list-item-label";
import {
  applyIngestedPrimaryImages,
  buildAdminPreviewImageSources,
  buildMovieTmdbImageIngestPayload,
  finalizeTmdbImageIngestMessage,
  mergeIngestedActorProfiles,
  needsPrimaryImageIngest,
  resolveTmdbSyncedImageFields,
  withTmdbImageProcessingMessage,
} from "../../../../lib/admin-tmdb-image-ingest";
import {
  toManagedImagePublicPath,
} from "../../../../lib/cinema-image";
import {
  inferDownloadQualityFromPath,
  looksLikeHlsPackagePath,
  normalizeDownloadLinkInput,
  normalizeMediaLinkInput,
} from "../../../../lib/media-link-input";
import { comparableHlsPlaylistUrl } from "../../../../lib/series-hls-paths";
import {
  productionStatusSelectOptions,
  translateProductionStatus,
  translatePublishStatus,
} from "../../../../lib/production-status";
import {
  SlugAvailabilityHint,
  useSlugAvailability,
} from "../../../../hooks/useSlugAvailability";
import {
  TmdbIdAvailabilityHint,
  useTmdbIdAvailability,
} from "../../../../hooks/useTmdbIdAvailability";
import { fingerprintMovie } from "../../../../lib/form-fingerprint";
import {
  clearPendingMoviePublish,
  loadPendingMoviePublish,
  savePendingMoviePublish,
} from "../../../../lib/pending-publish";
import PendingPublishBanner from "../../../../components/admin/PendingPublishBanner";
import ContentChangeHistoryPanel from "../../../../components/admin/ContentChangeHistoryPanel";
import AdminTaxonomyMultiSelect from "../../../../components/admin/AdminTaxonomyMultiSelect";
import {
  type AdminTaxonomyCountry,
  type AdminTaxonomyGenre,
  type AdminTaxonomyLanguage,
  countryLabelsForSave,
  languageValuesForSave,
  normalizeCountryValuesToIso,
  normalizeGenreValuesToCatalog,
  normalizeLanguageValuesToIso,
  normalizeOriginalLanguageToIso,
  toCountrySelectOptions,
  toGenreSelectOptions,
  toLanguageSelectOptions,
} from "../../../../lib/admin-taxonomy-options";

import {
  movieAgeRatingOptions,
  normalizeAgeRating,
} from "../../../../lib/age-rating";

type Mode = "create" | "edit";
type EditorTab = "details" | "media" | "seo" | "publish";

const ageRatingOptions = movieAgeRatingOptions(true);

const tabs: Array<{ key: EditorTab; label: string }> = [
  { key: "details", label: "جزئیات" },
  { key: "media", label: "لینک‌ها" },
  { key: "seo", label: "سئو" },
  { key: "publish", label: "انتشار" },
];

/** URL/path fields are English — use with `dir="ltr"` on the control */
const ltrLinkInputClass = "text-left";
const ltrInputClass = "text-left";

const downloadQualityOptions = [
  { value: "2160p", label: "2160p", description: "4K Ultra HD" },
  { value: "1440p", label: "1440p", description: "QHD" },
  { value: "1080p", label: "1080p", description: "Full HD" },
  { value: "720p", label: "720p", description: "HD" },
  { value: "480p", label: "480p", description: "SD" },
  { value: "360p", label: "360p", description: "Low quality" },
];

type DownloadLinkRow = {
  id: string;
  quality: string;
  url: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildSlug(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const nextSlug = slugify(candidate);

    if (nextSlug) {
      return nextSlug;
    }
  }

  return "";
}

function normalizeTmdbCodeInput(value: string) {
  const match = value.match(/\d+/);

  return match?.[0] ?? "";
}


type MovieCrewFormRow = {
  tmdb_person_id: number | null;
  name: string;
  job: string;
  department: string;
  profile_url: string | null;
  credit_id: string | null;
};

type MovieEditorFormState = {
  tmdb_query: string;
  title: string;
  original_title: string;
  slug: string;
  synopsis: string;
  synopsis_en: string;
  age_rating: string;
  release_year: string;
  tmdb_id: string;
  imdb_id: string;
  homepage_url: string;
  meta_title: string;
  meta_description: string;
  content_warnings: string[];
  dash_url: string;
  rating: string;
  popularity: string;
  vote_count: string;
  poster_url: string;
  backdrop_url: string;
  poster_source_url: string;
  backdrop_source_url: string;
  trailer_url: string;
  playback_protocol: "hls" | "mp4";
  hls_url: string;
  progressive_url: string;
  subtitle_source_path: string;
  dubbed_audio_url: string;
  has_subtitle: boolean;
  has_dubbed_audio: boolean;
  drm_scheme: string;
  drm_license_url: string;
  download_links: DownloadLinkRow[];
  original_language: string;
  runtime_minutes: string;
  provider_name: string;
  production_status: string;
  budget: string;
  revenue: string;
  directors: string[];
  writers: string[];
  genres: string[];
  tags: string[];
  languages: string[];
  countries: string[];
  actors: TmdbActor[];
  crew: MovieCrewFormRow[];
  belongs_to_collection: TmdbBelongsToCollection | null;
  is_featured: boolean;
  catalog_visibility: string;
  admin_notes: string;
};

type MovieEditorTextField = Exclude<
  keyof MovieEditorFormState,
  | "genres"
  | "tags"
  | "languages"
  | "countries"
  | "directors"
  | "writers"
  | "actors"
  | "crew"
  | "download_links"
  | "content_warnings"
>;

type MovieEditorArrayField = Extract<
  keyof MovieEditorFormState,
  "genres" | "tags" | "languages" | "countries" | "directors" | "writers"
>;

type MovieEditorFreeArrayField = Extract<
  MovieEditorArrayField,
  "tags" | "directors" | "writers"
>;

const freeArrayFieldLabels: Record<MovieEditorFreeArrayField, string> = {
  directors: "کارگردان‌ها",
  writers: "نویسنده‌ها (اختیاری)",
  tags: "برچسب‌ها",
};

const tabOrder: EditorTab[] = ["details", "media", "seo", "publish"];

const moviePublishStatusOptions = [
  { value: "draft", label: "پیش نویس", description: "در سایت عمومی نمایش داده نمی شود" },
  { value: "scheduled", label: "زمان بندی شده", description: "در زمان تعیین شده منتشر می شود" },
  { value: "published", label: "منتشر شده", description: "اکنون در سایت قابل مشاهده است" },
];

const movieCatalogVisibilityOptions = [
  { value: "catalog_search", label: "کاتالوگ و جستجو", description: "نمایش در لیست‌ها و نتایج جستجو" },
  { value: "catalog", label: "فقط کاتالوگ", description: "فقط در صفحات لیست فیلم‌ها" },
  { value: "search", label: "فقط جستجو", description: "فقط در نتایج جستجو" },
  { value: "hidden", label: "مخفی", description: "فقط از طریق لینک مستقیم قابل دسترسی است" },
];

function createInitialFormState(): MovieEditorFormState {
  return {
    tmdb_query: "",
    title: "",
    original_title: "",
    slug: "",
    synopsis: "",
    synopsis_en: "",
    age_rating: "",
    release_year: "",
    tmdb_id: "",
    imdb_id: "",
    homepage_url: "",
    meta_title: "",
    meta_description: "",
    content_warnings: [],
    dash_url: "",
    rating: "",
    popularity: "",
    vote_count: "",
    poster_url: "",
    backdrop_url: "",
    poster_source_url: "",
    backdrop_source_url: "",
    trailer_url: "",
    playback_protocol: "hls",
    hls_url: "",
    progressive_url: "",
    subtitle_source_path: "",
    dubbed_audio_url: "",
    has_subtitle: false,
    has_dubbed_audio: false,
    drm_scheme: "none",
    drm_license_url: "",
    download_links: [createDownloadLinkRow()],
    original_language: "",
    runtime_minutes: "",
    provider_name: "",
    production_status: "",
    budget: "",
    revenue: "",
    directors: [],
    writers: [],
    genres: [],
    tags: [],
    languages: [],
    countries: [],
    actors: [],
    crew: [],
    belongs_to_collection: null,
    is_featured: false,
    catalog_visibility: "catalog_search",
    admin_notes: "",
  };
}

function createDownloadLinkRow(
  quality = "1080p",
  url = "",
  id = `download-${Math.random().toString(36).slice(2, 10)}`,
): DownloadLinkRow {
  return { id, quality, url };
}

function normalizeActor(actor: TmdbActor): TmdbActor | null {
  const name = resolveLatinPersonName([actor.name]);

  if (!name) {
    return null;
  }

  const character = actor.character?.trim() || null;
  const profileUrl = actor.profile_url?.trim() || null;

  return {
    name,
    character,
    profile_url: profileUrl,
    tmdb_person_id: actor.tmdb_person_id ?? null,
    credit_id: actor.credit_id?.trim() || null,
    order: typeof actor.order === "number" ? actor.order : null,
    known_for_department: actor.known_for_department?.trim() || null,
  };
}

function normalizeActors(actors: TmdbActor[]) {
  return sortCastByOrder(
    actors
      .map((actor) => normalizeActor(actor))
      .filter((actor): actor is TmdbActor => actor !== null),
  );
}

function extractActorNames(actors: TmdbActor[]) {
  return normalizeActors(actors)
    .map((actor) => actor.name?.trim() || "")
    .filter((name): name is string => Boolean(name));
}

function parseTagInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeNumberInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatNumberWithCommas(value: string) {
  const numericValue = sanitizeNumberInput(value);

  if (!numericValue) {
    return "";
  }

  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function TmdbSkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[24px] border border-[#f5c518]/20 bg-[#f5c518]/10 ${className}`}
    />
  );
}

export default function MovieEditorForm({
  mode,
  movieId,
  createInstanceKey,
}: {
  mode: Mode;
  movieId?: string;
  createInstanceKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [movie, setMovie] = useState<AdminMovie | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");

      if (tab === "publish") {
        return "publish";
      }
    }

    return "details";
  });
  const [publishOutcomeOpen, setPublishOutcomeOpen] = useState(false);
  const [publishOutcomeStatus, setPublishOutcomeStatus] =
    useState<PublishOutcomeStatus>("draft");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string | null>(null);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  const [fetchingTmdb, setFetchingTmdb] = useState(false);
  const [ingestingTmdbImages, setIngestingTmdbImages] = useState(false);
  const [error, setError] = useState("");
  const [tabFieldErrors, setTabFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [lastFetchedTmdbCode, setLastFetchedTmdbCode] = useState("");
  const [listDrafts, setListDrafts] = useState<Record<MovieEditorFreeArrayField, string>>({
    directors: "",
    writers: "",
    tags: "",
  });
  const [taxonomyGenres, setTaxonomyGenres] = useState<AdminTaxonomyGenre[]>([]);
  const [taxonomyCountries, setTaxonomyCountries] = useState<AdminTaxonomyCountry[]>([]);
  const [taxonomyLanguages, setTaxonomyLanguages] = useState<AdminTaxonomyLanguage[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const latestTmdbRequestRef = useRef("");
  const tmdbImageIngestAbortRef = useRef<AbortController | null>(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);
  const fingerprintMovieRef = useRef("");
  const pendingNavigationRef = useRef<string | null>(null);
  const hlsPreviewGenerationRef = useRef(0);
  const lastHlsPreviewComparableRef = useRef("");
  const [form, setForm] = useState<MovieEditorFormState>(createInitialFormState);
  const [entryMode, setEntryMode] = useState<ContentEntryMode>("tmdb");
  const formRef = useRef(form);
  formRef.current = form;
  const [hlsSyncMessage, setHlsSyncMessage] = useState("");
  const [hlsPreviewLoading, setHlsPreviewLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("draft");
  const [scheduledFor, setScheduledFor] = useState("");
  const [pendingPublishVisible, setPendingPublishVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const publishIdempotencyKeyRef = useRef("");

  const sortedActorsWithIndex = useMemo(() => {
    const rows = form.actors
      .map((actor, index) => {
        const normalized = normalizeActor(actor);

        return normalized ? { actor: normalized, index } : null;
      })
      .filter((row): row is { actor: TmdbActor; index: number } => row !== null);

    return sortCastRows(rows, (row) => row.actor);
  }, [form.actors]);

  const resetCreateEditorState = () => {
    setMovie(null);
    setForm(createInitialFormState());
    setEntryMode("tmdb");
    setActiveTab("details");
    setPublishOutcomeOpen(false);
    setPublishOutcomeStatus("draft");
    setSubmitting(false);
    setSubmitStep(null);
    setSearchingTmdb(false);
    setFetchingTmdb(false);
    setIngestingTmdbImages(false);
    setError("");
    setSuccessMessage("");
    setSearchMessage("");
    setLastFetchedTmdbCode("");
    setListDrafts({
      directors: "",
      writers: "",
      tags: "",
    });
    setHlsSyncMessage("");
    setHlsPreviewLoading(false);
    setPublishStatus("draft");
    setScheduledFor("");
    setPendingPublishVisible(false);
    setPreviewLoading(false);
    latestTmdbRequestRef.current = "";
    fingerprintMovieRef.current = "";
    pendingNavigationRef.current = null;
    hlsPreviewGenerationRef.current = 0;
    lastHlsPreviewComparableRef.current = "";
    publishIdempotencyKeyRef.current = "";
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setTaxonomyLoading(true);
      setError("");

      const optionsPromise = adminMoviesService.options();

      if (mode === "create") {
        resetCreateEditorState();
        const optionsResponse = await optionsPromise;
        if (optionsResponse.success && optionsResponse.data) {
          setTaxonomyGenres(optionsResponse.data.genres ?? []);
          setTaxonomyCountries(optionsResponse.data.countries ?? []);
          setTaxonomyLanguages(optionsResponse.data.languages ?? []);
        }
        setTaxonomyLoading(false);
        setLoading(false);
        return;
      }

      if (mode === "edit" && movieId) {
        const [optionsResponse, movieResponse] = await Promise.all([
          optionsPromise,
          adminMoviesService.show(movieId),
        ]);

        const nextGenres = optionsResponse.success
          ? (optionsResponse.data?.genres ?? [])
          : [];
        const nextCountries = optionsResponse.success
          ? (optionsResponse.data?.countries ?? [])
          : [];
        const nextLanguages = optionsResponse.success
          ? (optionsResponse.data?.languages ?? [])
          : [];
        setTaxonomyGenres(nextGenres);
        setTaxonomyCountries(nextCountries);
        setTaxonomyLanguages(nextLanguages);
        setTaxonomyLoading(false);

        if (!(movieResponse.success && movieResponse.data)) {
          setError(movieResponse.message || "دریافت اطلاعات فیلم انجام نشد.");
          setLoading(false);
          return;
        }

        const nextMovie = movieResponse.data.movie;
        const storedActors = nextMovie.metadata?.tmdb?.actors || [];
        const castFromApi = (nextMovie.cast || []).map((c) => ({
          name: c.name || null,
          character: c.character || null,
          profile_url: c.profile_url || null,
          tmdb_person_id: c.tmdb_person_id ?? null,
          credit_id: c.credit_id || null,
          order: typeof c.order === "number" ? c.order : 0,
          known_for_department: c.known_for_department || "Acting",
        }));
        const initialActors = castFromApi.length ? castFromApi : storedActors;
        const initialCrew = (nextMovie.crew || []).map((c) => ({
          tmdb_person_id: c.tmdb_person_id ?? null,
          name: c.name || "",
          job: c.job || "",
          department: c.department || "",
          profile_url: c.profile_url || null,
          credit_id: c.credit_id || null,
        }));
        setMovie(nextMovie);
        const synopsisFields = normalizeSeasonEpisodeSynopsis(
          nextMovie.synopsis,
          nextMovie.metadata?.tmdb?.synopsis_en,
        );
        const loadedForm = {
          tmdb_query: nextMovie.metadata?.tmdb?.tmdb_id
            ? String(nextMovie.metadata.tmdb.tmdb_id)
            : "",
          title: nextMovie.title || nextMovie.original_title || "",
          original_title: nextMovie.original_title || "",
          slug: nextMovie.slug || "",
          synopsis: synopsisFields.synopsis,
          synopsis_en: synopsisFields.synopsis_en,
          age_rating: normalizeAgeRating(nextMovie.age_rating) || "",
          release_year: nextMovie.release_year ? String(nextMovie.release_year) : "",
          tmdb_id: nextMovie.metadata?.tmdb?.tmdb_id
            ? String(nextMovie.metadata.tmdb.tmdb_id)
            : "",
          imdb_id: nextMovie.metadata?.tmdb?.imdb_id || "",
          homepage_url: nextMovie.metadata?.tmdb?.homepage_url || "",
          meta_title: nextMovie.metadata?.seo?.meta_title || "",
          meta_description: nextMovie.metadata?.seo?.meta_description || "",
          content_warnings: nextMovie.metadata?.content_warnings || [],
          dash_url: nextMovie.metadata?.playback?.dash_url || "",
          rating:
            typeof nextMovie.metadata?.tmdb?.rating === "number"
              ? String(nextMovie.metadata.tmdb.rating)
              : "",
          popularity:
            typeof nextMovie.metadata?.tmdb?.popularity === "number"
              ? String(nextMovie.metadata.tmdb.popularity)
              : "",
          vote_count:
            typeof nextMovie.metadata?.tmdb?.vote_count === "number"
              ? String(nextMovie.metadata.tmdb.vote_count)
              : "",
          poster_url:
            toManagedImagePublicPath(nextMovie.poster_image?.original) ||
            toManagedImagePublicPath(nextMovie.poster_url) ||
            nextMovie.metadata?.tmdb?.poster_url ||
            nextMovie.poster_url ||
            "",
          backdrop_url:
            toManagedImagePublicPath(nextMovie.backdrop_image?.original) ||
            toManagedImagePublicPath(nextMovie.backdrop_url) ||
            nextMovie.metadata?.tmdb?.backdrop_url ||
            "",
          poster_source_url:
            nextMovie.metadata?.tmdb?.poster_source_url ||
            nextMovie.metadata?.tmdb?.poster_url ||
            "",
          backdrop_source_url:
            nextMovie.metadata?.tmdb?.backdrop_source_url ||
            nextMovie.metadata?.tmdb?.backdrop_url ||
            "",
          trailer_url:
            nextMovie.metadata?.tmdb?.trailer_url || nextMovie.trailer_url || "",
          playback_protocol: (
            nextMovie.metadata?.playback?.protocol === "mp4" ||
            (Boolean(nextMovie.metadata?.playback?.progressive_url) &&
              !nextMovie.metadata?.playback?.hls_url)
              ? "mp4"
              : "hls"
          ) as MovieEditorFormState["playback_protocol"],
          hls_url:
            nextMovie.metadata?.playback?.hls_url ||
            nextMovie.media_asset?.master_playlist_url ||
            "",
          progressive_url: nextMovie.metadata?.playback?.progressive_url || "",
          subtitle_source_path:
            nextMovie.subtitle_source_url || nextMovie.subtitle_source_path || "",
          dubbed_audio_url: nextMovie.dubbed_source_url || "",
          has_subtitle: Boolean(nextMovie.has_subtitle),
          has_dubbed_audio: Boolean(nextMovie.has_dubbed_audio),
          drm_scheme: nextMovie.drm_scheme || "none",
          drm_license_url: nextMovie.drm_license_url || "",
          download_links: Object.entries(nextMovie.metadata?.playback?.downloads || {}).length
            ? Object.entries(nextMovie.metadata?.playback?.downloads || {}).map(([quality, url]) =>
                createDownloadLinkRow(quality, url, `download-${quality}`),
              )
            : [createDownloadLinkRow()],
          original_language: normalizeOriginalLanguageToIso(
            nextMovie.metadata?.tmdb?.original_language || "",
            nextLanguages,
          ),
          runtime_minutes:
            nextMovie.metadata?.tmdb?.runtime_minutes != null
              ? String(nextMovie.metadata.tmdb.runtime_minutes)
              : "",
          provider_name: nextMovie.provider_name || "",
          production_status: nextMovie.metadata?.tmdb?.production_status || "",
          budget:
            typeof nextMovie.metadata?.tmdb?.budget === "number"
              ? String(nextMovie.metadata.tmdb.budget)
              : "",
          revenue:
            typeof nextMovie.metadata?.tmdb?.revenue === "number"
              ? String(nextMovie.metadata.tmdb.revenue)
              : "",
          directors: normalizeStringList(nextMovie.metadata?.tmdb?.directors || []),
          writers: normalizeStringList(nextMovie.metadata?.tmdb?.writers || []),
          genres: normalizeGenreValuesToCatalog(
            nextMovie.metadata?.tmdb?.genres || [],
            toGenreSelectOptions(nextGenres),
          ),
          tags: normalizeStringList(nextMovie.metadata?.tmdb?.tags || []),
          languages: normalizeLanguageValuesToIso(
            nextMovie.metadata?.tmdb?.languages || [],
            nextLanguages,
          ),
          countries: normalizeCountryValuesToIso(
            nextMovie.metadata?.tmdb?.countries || [],
            nextCountries,
          ),
          actors: initialActors,
          crew: initialCrew,
          belongs_to_collection:
            nextMovie.metadata?.tmdb?.belongs_to_collection ?? null,
          is_featured: Boolean(nextMovie.is_featured),
          catalog_visibility: nextMovie.catalog_visibility || "catalog_search",
          admin_notes:
            nextMovie.admin_notes ||
            nextMovie.metadata?.admin_notes ||
            "",
        };
        setForm(loadedForm);
        setEntryMode(
          resolveContentEntryMode({
            savedSource: nextMovie.metadata?.content_source,
            tmdbId:
              nextMovie.tmdb_id ??
              nextMovie.metadata?.tmdb?.tmdb_id ??
              loadedForm.tmdb_id,
            isCreate: false,
          }),
        );
        setPendingPublishVisible(
          Boolean(nextMovie.publish_completion_pending) ||
            Boolean(loadPendingMoviePublish(nextMovie.id)),
        );
        setLastFetchedTmdbCode(
          normalizeTmdbCodeInput(loadedForm.tmdb_id || loadedForm.tmdb_query),
        );
        fingerprintMovieRef.current = fingerprintMovie(loadedForm);
        setPublishStatus(nextMovie.publish_status || "draft");
        setScheduledFor(apiDateTimeToInputValue(nextMovie.scheduled_for));
      }

      setLoading(false);
    };

    if (mode === "create" || movieId) {
      void loadData();
    }
  }, [mode, movieId, createInstanceKey]);

  useEffect(() => {
    if (mode !== "create" || loading || entryMode !== "tmdb") {
      return;
    }

    const tmdbCode = normalizeTmdbCodeInput(form.tmdb_query);

    if (!tmdbCode || tmdbCode === lastFetchedTmdbCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      void handleAutoTmdbFetch(tmdbCode);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form.tmdb_query, mode, loading, lastFetchedTmdbCode, entryMode]);

  const handleChange = (field: MovieEditorTextField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const genreSelectOptions = useMemo(
    () => toGenreSelectOptions(taxonomyGenres),
    [taxonomyGenres],
  );
  const countrySelectOptions = useMemo(
    () => toCountrySelectOptions(taxonomyCountries),
    [taxonomyCountries],
  );
  const languageSelectOptions = useMemo(
    () => toLanguageSelectOptions(taxonomyLanguages),
    [taxonomyLanguages],
  );
  const originalLanguageSelectOptions = useMemo(
    () => [
      { value: "", label: "انتخاب زبان اصلی", description: "مطابق فیلتر کنترل" },
      ...languageSelectOptions.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.value.toUpperCase(),
      })),
    ],
    [languageSelectOptions],
  );

  const addArrayItems = (field: MovieEditorFreeArrayField, rawValue: string) => {
    const parsed = parseTagInput(rawValue);
    const personFields: MovieEditorFreeArrayField[] = ["directors", "writers"];
    const nextItems = personFields.includes(field)
      ? filterLatinPersonNameList(parsed)
      : normalizeStringList(parsed);

    if (!nextItems.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: Array.from(new Set([...(current[field] || []), ...nextItems])),
    }));
  };

  const removeArrayItem = (field: MovieEditorFreeArrayField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter(
        (item) => normalizeListItemLabel(item) !== value,
      ),
    }));
  };

  const handleArrayInputSubmit = (field: MovieEditorFreeArrayField) => {
    const currentDraft = listDrafts[field].trim();

    if (!currentDraft) {
      return;
    }

    addArrayItems(field, currentDraft);
    setListDrafts((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const handleActorChange = (
    index: number,
    field: keyof TmdbActor,
    value: string,
  ) => {
    const nextValue =
      field === "name"
        ? isManualMode
          ? value
          : sanitizeLatinPersonName(value) || null
        : value || null;

    setForm((current) => ({
      ...current,
      actors: current.actors.map((actor, actorIndex) =>
        actorIndex === index
          ? {
              ...actor,
              [field]: nextValue,
            }
          : actor,
      ),
    }));
  };

  const addActorRow = () => {
    setForm((current) => ({
      ...current,
      actors: [
        ...current.actors,
        {
          name: "",
          character: "",
          profile_url: null,
          tmdb_person_id: null,
          credit_id: null,
          order: current.actors.length,
          known_for_department: null,
        },
      ],
    }));
  };

  const removeActorRow = (index: number) => {
    setForm((current) => ({
      ...current,
      actors: current.actors.filter((_, actorIndex) => actorIndex !== index),
    }));
  };

  const handleDownloadLinkChange = (
    index: number,
    field: keyof Omit<DownloadLinkRow, "id">,
    value: string,
  ) => {
    const nextValue = field === "url" ? normalizeDownloadLinkInput(value) : value;

    setForm((current) => ({
      ...current,
      download_links: current.download_links.map((link, linkIndex) =>
        linkIndex === index
          ? {
              ...link,
              [field]: nextValue,
            }
          : link,
      ),
    }));
  };

  const applyHlsPackageInsights = (
    payload: {
      canonical_hls_url?: string | null;
      subtitle_source_url?: string | null;
      dubbed_audio_url?: string | null;
      download_links?: Record<string, string>;
      has_dubbed_audio?: boolean;
      has_subtitle?: boolean;
    },
    options?: { mergeDownloads?: boolean },
  ) => {
    setForm((prev) => {
      let nextTags = prev.tags;

      if (
        payload.has_dubbed_audio &&
        !nextTags.some((tag) => /دوبله|\bdub\b/i.test(tag))
      ) {
        nextTags = [...nextTags, "دوبله"];
      }

      const discoveredDownloads =
        payload.download_links && Object.keys(payload.download_links).length > 0
          ? Object.entries(payload.download_links).map(([quality, url]) =>
              createDownloadLinkRow(quality, url, `download-${quality}`),
            )
          : [];

      return {
        ...prev,
        hls_url: payload.canonical_hls_url || prev.hls_url,
        subtitle_source_path:
          payload.subtitle_source_url != null &&
          String(payload.subtitle_source_url).trim() !== ""
            ? String(payload.subtitle_source_url).trim()
            : prev.subtitle_source_path,
        dubbed_audio_url:
          payload.dubbed_audio_url != null &&
          String(payload.dubbed_audio_url).trim() !== ""
            ? String(payload.dubbed_audio_url).trim()
            : prev.dubbed_audio_url,
        has_subtitle: payload.has_subtitle ?? prev.has_subtitle,
        has_dubbed_audio: payload.has_dubbed_audio ?? prev.has_dubbed_audio,
        download_links:
          options?.mergeDownloads === false
            ? prev.download_links
            : discoveredDownloads.length > 0
              ? discoveredDownloads
              : prev.download_links,
        tags: nextTags,
      };
    });
  };

  const resolveDownloadsFromPackage = async (raw: string) => {
    const normalized = normalizeDownloadLinkInput(raw);

    if (!normalized) {
      return;
    }

    setHlsPreviewLoading(true);

    try {
      const response = await adminMoviesService.previewHlsPackage(normalized, {
        resolveDownloads: true,
      });

      if (!(response.success && response.data)) {
        setError(response.message || "شناسایی لینک‌های دانلود از پکیج انجام نشد.");
        return;
      }

      const payload = response.data;
      lastHlsPreviewComparableRef.current = comparableHlsPlaylistUrl(
        payload.canonical_hls_url || normalized,
      );
      applyHlsPackageInsights(payload);
      setHlsSyncMessage(
        response.data.download_links && Object.keys(response.data.download_links).length > 0
          ? "لینک‌های دانلود از پکیج HLS شناسایی شدند."
          : "پکیج HLS بررسی شد؛ لینک دانلود جداگانه‌ای پیدا نشد.",
      );
    } finally {
      setHlsPreviewLoading(false);
    }
  };

  const handleDownloadLinkPaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = normalizeMediaLinkInput(event.clipboardData.getData("text"));

    if (!pasted) {
      return;
    }

    event.preventDefault();

    if (looksLikeHlsPackagePath(pasted)) {
      void resolveDownloadsFromPackage(pasted);
      return;
    }

    const normalizedUrl = normalizeDownloadLinkInput(pasted);
    const inferredQuality = inferDownloadQualityFromPath(normalizedUrl);

    setForm((current) => ({
      ...current,
      download_links: current.download_links.map((link, linkIndex) =>
        linkIndex === index
          ? {
              ...link,
              url: normalizedUrl,
              quality:
                link.quality.trim() || inferredQuality || link.quality,
            }
          : link,
      ),
    }));
  };

  const addDownloadLinkRow = () => {
    setForm((current) => ({
      ...current,
      download_links: [...current.download_links, createDownloadLinkRow("", "")],
    }));
  };

  const removeDownloadLinkRow = (index: number) => {
    setForm((current) => {
      const nextLinks = current.download_links.filter((_, linkIndex) => linkIndex !== index);

      return {
        ...current,
        download_links: nextLinks.length ? nextLinks : [createDownloadLinkRow()],
      };
    });
  };

  const isManualMode = entryMode === "manual";

  const isDetailsTabComplete = isManualMode
    ? form.title.trim() !== "" &&
      form.original_title.trim() !== "" &&
      form.slug.trim() !== "" &&
      form.synopsis.trim() !== "" &&
      form.age_rating.trim() !== "" &&
      form.genres.length > 0 &&
      form.countries.length > 0 &&
      form.languages.length > 0
    : form.tmdb_id.trim() !== "" &&
      form.title.trim() !== "" &&
      buildSlug(
        form.slug,
        form.original_title,
        form.title,
        form.tmdb_id ? `movie-${form.tmdb_id}` : null,
      ) !== "" &&
      form.synopsis.trim() !== "" &&
      form.release_year.trim() !== "" &&
      form.age_rating.trim() !== "" &&
      form.directors.length > 0 &&
      normalizeActors(form.actors).length > 0;

  const isMediaTabComplete = isManualMode
    ? form.poster_url.trim() !== "" &&
      form.backdrop_url.trim() !== "" &&
      (form.playback_protocol !== "mp4" ||
        !form.progressive_url.trim() ||
        isProgressiveVideoUrl(form.progressive_url))
    : form.poster_url.trim() !== "" &&
      form.backdrop_url.trim() !== "" &&
      (form.playback_protocol === "mp4"
        ? !form.progressive_url.trim() || isProgressiveVideoUrl(form.progressive_url)
        : form.hls_url.trim() !== "");

  const canProceedToNextTab =
    activeTab === "details"
      ? isDetailsTabComplete
      : activeTab === "media"
        ? isMediaTabComplete
        : activeTab === "seo"
          ? true
          : false;

  const slugAvailability = useSlugAvailability({
    slug: form.slug,
    excludeId: movie?.id ?? movieId,
    check: adminMoviesService.checkSlug,
  });

  const tmdbCodeForAvailability = normalizeTmdbCodeInput(
    form.tmdb_query || form.tmdb_id,
  );

  const tmdbAvailability = useTmdbIdAvailability({
    tmdbId: tmdbCodeForAvailability,
    excludeId: movie?.id ?? movieId,
    check: adminMoviesService.checkTmdbId,
    enabled: !isManualMode,
  });

  useEffect(() => {
    if (isManualMode) {
      setTabFieldErrors((current) => {
        if (!current.tmdb_id) {
          return current;
        }
        const next = { ...current };
        delete next.tmdb_id;
        return next;
      });
      return;
    }

    if (tmdbAvailability.isTaken) {
      const existingTitle = tmdbAvailability.existing?.title;
      setTabFieldErrors((current) => ({
        ...current,
        tmdb_id: existingTitle
          ? `این کد TMDb قبلاً برای «${existingTitle}» ثبت شده است.`
          : "این کد TMDb قبلاً ثبت شده است.",
      }));
      return;
    }

    if (tmdbAvailability.isAvailable || tmdbAvailability.status === "idle") {
      setTabFieldErrors((current) => {
        if (!current.tmdb_id) {
          return current;
        }
        const next = { ...current };
        delete next.tmdb_id;
        return next;
      });
    }
  }, [
    isManualMode,
    tmdbAvailability.isTaken,
    tmdbAvailability.isAvailable,
    tmdbAvailability.status,
    tmdbAvailability.existing?.title,
  ]);

  const canSubmitForm =
    isDetailsTabComplete &&
    isMediaTabComplete &&
    !slugAvailability.isChecking &&
    !slugAvailability.isTaken &&
    (isManualMode || (!tmdbAvailability.isChecking && !tmdbAvailability.isTaken));

  useEffect(() => {
    if (searchParams.get("tab") === "publish") {
      setActiveTab("publish");
    }
  }, [searchParams]);

  const canAccessTab = (target: EditorTab) => {
    if (target === "details") {
      return true;
    }
    if (target === "media") {
      return isDetailsTabComplete;
    }
    if (target === "seo") {
      return isDetailsTabComplete && isMediaTabComplete;
    }
    return isDetailsTabComplete && isMediaTabComplete;
  };

  const applyTabFieldIssues = (
    issues: ReturnType<typeof validateMovieTab>,
  ): boolean => {
    if (issues.length === 0) {
      return false;
    }

    setTabFieldErrors(issuesToErrorMap(issues));
    setError(issues[0].message);
    scrollToFormField(issues[0].field);
    return true;
  };

  const goToTab = (target: EditorTab) => {
    if (target !== "details") {
      const detailsIssues = validateMovieDetailsTab(form, buildSlug, entryMode);

      if (detailsIssues.length > 0) {
        if (activeTab !== "details") {
          setActiveTab("details");
        }

        applyTabFieldIssues(detailsIssues);
        return;
      }
    }

    if (target === "seo" || target === "publish") {
      const mediaIssues = validateMovieMediaTab(form, entryMode);

      if (mediaIssues.length > 0) {
        if (activeTab !== "media") {
          setActiveTab("media");
        }

        applyTabFieldIssues(mediaIssues);
        return;
      }
    }

    if (!canAccessTab(target)) {
      setError(
        target === "media"
          ? "ابتدا مرحله جزئیات را کامل کن."
          : target === "seo"
            ? "ابتدا مراحل جزئیات و لینک‌ها را کامل کن."
            : "ابتدا مراحل جزئیات و لینک‌ها را کامل کن.",
      );
      return;
    }

    setActiveTab(target);
    setTabFieldErrors({});
    setError("");
    window.requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goToPreviousTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);

    if (currentIndex <= 0) {
      return;
    }

    goToTab(tabOrder[currentIndex - 1]);
  };

  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);

    if (currentIndex >= tabOrder.length - 1) {
      return;
    }

    const issues = validateMovieTab(activeTab, form, buildSlug, entryMode);

    if (applyTabFieldIssues(issues) || !canProceedToNextTab) {
      if (!issues.length && !canProceedToNextTab) {
        setError("ابتدا فیلدهای اجباری این تب را کامل کنید.");
      }
      return;
    }

    const nextTab = tabOrder[currentIndex + 1];
    if (!canAccessTab(nextTab)) {
      setError("ابتدا فیلدهای اجباری این تب را کامل کنید.");
      return;
    }

    setTabFieldErrors({});
    setError("");
    setActiveTab(nextTab);
    window.requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const buildTmdbMovieFormState = (
    current: MovieEditorFormState,
    payload: TmdbMoviePayload,
    query: string,
  ): MovieEditorFormState => {
    const nextTitle = payload.title || payload.original_title || current.title;
    const nextActors = payload.cast?.length
      ? normalizeActors(
          payload.cast.map((c, idx) => ({
            name: resolveLatinPersonName([c.name]) || null,
            character: c.character || null,
            profile_url: c.profile_url || null,
            tmdb_person_id: c.tmdb_person_id ?? null,
            credit_id: c.credit_id || null,
            order: typeof c.order === "number" ? c.order : idx,
            known_for_department: c.known_for_department || "Acting",
          })),
        )
      : normalizeActors(payload.actors || []);
    const nextCrew: MovieCrewFormRow[] = [];
    const primaryProducer = payload.production_companies?.find((company) =>
      (company?.name || "").trim() !== "",
    )?.name;

    for (const cr of payload.crew || []) {
      const name = resolveLatinPersonName([cr.name]);

      if (!name) {
        continue;
      }

      nextCrew.push({
        tmdb_person_id: cr.tmdb_person_id ?? null,
        name,
        job: cr.job || "",
        department: cr.department || "",
        profile_url: cr.profile_url || null,
        credit_id: cr.credit_id || null,
      });
    }

    return {
      ...current,
      tmdb_query: query,
      title: nextTitle,
      original_title: payload.original_title || current.original_title,
      slug:
        buildSlug(
          payload.original_title,
          nextTitle,
          current.original_title,
          current.title,
          payload.tmdb_id ? `movie-${payload.tmdb_id}` : null,
        ) || current.slug,
      ...mergeSeasonEpisodeSynopsisFromTmdb(
        resolveTmdbMainSynopsis(payload),
        payload.synopsis_en,
        current.synopsis,
        current.synopsis_en,
      ),
      release_year: payload.release_year ? String(payload.release_year) : current.release_year,
      tmdb_id: payload.tmdb_id ? String(payload.tmdb_id) : current.tmdb_id,
      imdb_id: current.imdb_id.trim() || payload.imdb_id || current.imdb_id,
      homepage_url: current.homepage_url.trim() || payload.homepage_url || current.homepage_url,
      rating: typeof payload.rating === "number" ? String(payload.rating) : current.rating,
      popularity:
        typeof payload.popularity === "number" ? String(payload.popularity) : current.popularity,
      vote_count:
        typeof payload.vote_count === "number" ? String(payload.vote_count) : current.vote_count,
      ...resolveTmdbSyncedImageFields({
        poster_url: payload.poster_url,
        backdrop_url: payload.backdrop_url,
        current_poster_url: current.poster_url,
        current_backdrop_url: current.backdrop_url,
      }),
      trailer_url: payload.trailer_url || current.trailer_url,
      age_rating: normalizeAgeRating(payload.age_rating) || current.age_rating,
      original_language: normalizeOriginalLanguageToIso(
        payload.original_language || current.original_language,
        taxonomyLanguages,
      ),
      runtime_minutes:
        typeof payload.runtime_minutes === "number"
          ? String(payload.runtime_minutes)
          : current.runtime_minutes,
      provider_name: primaryProducer?.trim() || current.provider_name,
      production_status: payload.production_status || current.production_status,
      budget:
        typeof payload.budget === "number" && payload.budget > 0
          ? String(payload.budget)
          : current.budget,
      revenue:
        typeof payload.revenue === "number" && payload.revenue > 0
          ? String(payload.revenue)
          : current.revenue,
      directors: payload.directors?.length
        ? filterLatinPersonNameList(payload.directors)
        : current.directors,
      writers: payload.writers?.length
        ? filterLatinPersonNameList(payload.writers)
        : current.writers,
      genres: payload.genres?.length
        ? normalizeGenreValuesToCatalog(payload.genres, genreSelectOptions)
        : current.genres,
      tags: payload.tags?.length ? normalizeStringList(payload.tags) : current.tags,
      languages: payload.languages?.length
        ? normalizeLanguageValuesToIso(payload.languages, taxonomyLanguages)
        : current.languages,
      countries: payload.countries?.length
        ? normalizeCountryValuesToIso(payload.countries, taxonomyCountries)
        : current.countries,
      actors: nextActors,
      crew: nextCrew.length ? nextCrew : current.crew,
      belongs_to_collection: payload.belongs_to_collection ?? null,
    };
  };

  const applyTmdbMovie = (payload: TmdbMoviePayload, query: string): MovieEditorFormState => {
    const nextForm = buildTmdbMovieFormState(formRef.current, payload, query);
    formRef.current = nextForm;
    setForm(nextForm);
    setActiveTab("details");
    return nextForm;
  };

  async function ingestTmdbImagesAfterSync(
    payload: TmdbMoviePayload,
    baseForm: MovieEditorFormState,
  ) {
    tmdbImageIngestAbortRef.current?.abort();
    const abortController = new AbortController();
    tmdbImageIngestAbortRef.current = abortController;
    const { signal } = abortController;

    setIngestingTmdbImages(true);
    setSearchMessage((current) =>
      withTmdbImageProcessingMessage(current, "پردازش تصاویر در حال انجام است."),
    );

    try {
      let latestForm = baseForm;
      let lastData: Awaited<ReturnType<typeof adminMoviesService.ingestTmdbImages>>["data"] | null =
        null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (signal.aborted) {
          return;
        }

        const response = await adminMoviesService.ingestTmdbImages(
          buildMovieTmdbImageIngestPayload(payload, movie?.id ?? movieId ?? null),
          { signal },
        );

        if (signal.aborted || !response.success || !response.data) {
          if (attempt < 2) {
            await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
          }
          continue;
        }

        lastData = response.data;
        latestForm = {
          ...applyIngestedPrimaryImages(latestForm, response.data, {
            poster_url: payload.poster_url,
            backdrop_url: payload.backdrop_url,
          }),
          actors: response.data.actors?.length
            ? mergeIngestedActorProfiles(latestForm.actors, response.data.actors)
            : latestForm.actors,
        };

        if (!needsPrimaryImageIngest(latestForm)) {
          break;
        }

        if (attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
        }
      }

      if (signal.aborted) {
        return;
      }

      formRef.current = latestForm;
      setForm(latestForm);

      if ((lastData?.stats?.succeeded ?? 0) > 0) {
        setSearchMessage((current) => finalizeTmdbImageIngestMessage(current));
      }
    } catch (ingestError) {
      if (ingestError instanceof Error && ingestError.name === "AbortError") {
        return;
      }
    } finally {
      if (!signal.aborted) {
        setIngestingTmdbImages(false);
      }
    }
  }

  async function fetchAndApplyTmdb(tmdbId: string, nextMessage?: string) {
    const requestKey = normalizeTmdbCodeInput(String(tmdbId));
    if (!requestKey) {
      setError("کد TMDb معتبر نیست.");
      return;
    }

    const excludeId = movie?.id ?? movieId;
    const uniqueness = await adminMoviesService.checkTmdbId(requestKey, excludeId);
    if (uniqueness.success && uniqueness.data && !uniqueness.data.available) {
      const existing = uniqueness.data.existing;
      const message = existing?.title
        ? `این کد TMDb قبلاً برای «${existing.title}» (#${existing.id}) ثبت شده است. از ویرایش همان فیلم استفاده کنید.`
        : "این کد TMDb قبلاً ثبت شده است.";
      setError(message);
      setTabFieldErrors((current) => ({ ...current, tmdb_id: message }));
      setActiveTab("details");
      setFetchingTmdb(false);
      return;
    }

    latestTmdbRequestRef.current = requestKey;
    setFetchingTmdb(true);
    setError("");

    const response = await adminMoviesService.fetchTmdb(requestKey);

    if (latestTmdbRequestRef.current !== requestKey) {
      setFetchingTmdb(false);
      return;
    }

    if (response.success && response.data) {
      const syncedForm = applyTmdbMovie(response.data.movie, requestKey);
      setLastFetchedTmdbCode(String(response.data.movie.tmdb_id ?? requestKey));
      setSearchMessage(
        nextMessage || "اطلاعات فیلم از TMDB روی فرم اعمال شد؛ پردازش تصاویر در حال انجام است.",
      );
      void ingestTmdbImagesAfterSync(response.data.movie, syncedForm);
    } else {
      const firstError = response.errors
        ? Object.values(response.errors)[0]?.[0]
        : undefined;
      setError(firstError || response.message || "دریافت اطلاعات فیلم از TMDB انجام نشد.");
    }

    setFetchingTmdb(false);
  }

  const handleAutoTmdbFetch = useEffectEvent(async (tmdbCode: string, nextMessage?: string) => {
    await fetchAndApplyTmdb(tmdbCode, nextMessage);
    setSearchingTmdb(false);
  });

  const handleTmdbCodeChange = (value: string) => {
    const normalizedCode = normalizeTmdbCodeInput(value);

    setForm((current) => ({
      ...current,
      tmdb_query: normalizedCode,
    }));

    setError("");
    setSearchMessage("");

    if (!normalizedCode) {
      setSearchingTmdb(false);
      setLastFetchedTmdbCode("");
      return;
    }

    setSearchingTmdb(false);
  };

  const handleManualTmdbSync = async () => {
    const tmdbCode = normalizeTmdbCodeInput(form.tmdb_query);
    if (!tmdbCode) {
      setError("کد TMDB را وارد کنید.");
      return;
    }
    setSearchingTmdb(true);
    await fetchAndApplyTmdb(tmdbCode, "اطلاعات فیلم از TMDB روی فرم اعمال شد.");
    setSearchingTmdb(false);
  };

  useEffect(() => {
    if (form.playback_protocol !== "hls") {
      setHlsSyncMessage("");
      setHlsPreviewLoading(false);
      return;
    }

    const raw = form.hls_url.trim();

    if (!raw) {
      setHlsSyncMessage("");
      setHlsPreviewLoading(false);
      lastHlsPreviewComparableRef.current = "";
      return;
    }

    const comparable = comparableHlsPlaylistUrl(raw);

    if (comparable && comparable === lastHlsPreviewComparableRef.current) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const generation = ++hlsPreviewGenerationRef.current;
      setHlsPreviewLoading(true);

      try {
        const response = await adminMoviesService.previewHlsPackage(raw, {
          resolveDownloads: false,
        });

        if (generation !== hlsPreviewGenerationRef.current) {
          return;
        }

        if (!(response.success && response.data)) {
          return;
        }

        const payload = response.data;
        const previewComparable = comparableHlsPlaylistUrl(
          payload.canonical_hls_url || raw,
        );
        lastHlsPreviewComparableRef.current = previewComparable;
        applyHlsPackageInsights(payload, { mergeDownloads: false });

        setHlsSyncMessage(
          payload.download_links && Object.keys(payload.download_links).length > 0
            ? "زیرنویس، دوبله و لینک‌های دانلود از پکیج HLS همگام شد."
            : "زیرنویس و دوبله از پکیج HLS همگام شد.",
        );
      } finally {
        if (generation === hlsPreviewGenerationRef.current) {
          setHlsPreviewLoading(false);
        }
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form.hls_url, form.playback_protocol]);

  const buildPublicationFormData = () => {
    const formData = new FormData();
    const normalizedActors = normalizeActors(form.actors);
    const downloadLinks = form.download_links.reduce<Record<string, string>>((accumulator, link) => {
      const quality = link.quality.trim();
      const url = normalizeDownloadLinkInput(link.url);

      if (!quality || !url) {
        return accumulator;
      }

      accumulator[quality] = url;
      return accumulator;
    }, {});
    const castMembers = extractActorNames(normalizedActors);
    const resolvedSlug =
      form.slug.trim() ||
      buildSlug(
        form.original_title,
        form.title,
        form.tmdb_id ? `movie-${form.tmdb_id}` : null
      );

    formData.append("title", form.title.trim());
    formData.append("slug", resolvedSlug);
    formData.append("content_source", entryMode);

    if (form.original_title.trim()) {
      formData.append("original_title", form.original_title.trim());
    }
    if (form.synopsis.trim()) {
      formData.append("synopsis", form.synopsis.trim());
    }
    if (form.synopsis_en.trim()) {
      formData.append("synopsis_en", form.synopsis_en.trim());
    }
    if (form.age_rating) {
      formData.append("age_rating", normalizeAgeRating(form.age_rating) || form.age_rating);
    }
    if (form.release_year) {
      formData.append("release_year", form.release_year);
    }
    if (entryMode === "tmdb" && form.tmdb_id) {
      formData.append("tmdb_id", form.tmdb_id);
    }
    if (form.imdb_id.trim()) {
      formData.append("imdb_id", form.imdb_id.trim());
    }
    if (form.homepage_url.trim()) {
      formData.append("homepage_url", form.homepage_url.trim());
    }
    if (form.meta_title.trim()) {
      formData.append("meta_title", form.meta_title.trim());
    }
    if (form.meta_description.trim()) {
      formData.append("meta_description", form.meta_description.trim());
    }
    if (form.drm_scheme !== "none" && form.dash_url.trim()) {
      formData.append("dash_url", form.dash_url.trim());
    }
    form.content_warnings.forEach((value) => formData.append("content_warnings[]", value));
    if (entryMode === "tmdb" && form.tmdb_query.trim()) {
      formData.append("tmdb_query", form.tmdb_query.trim());
    }
    if (form.rating) {
      formData.append("rating", form.rating);
    }
    if (form.popularity) {
      formData.append("popularity", form.popularity);
    }
    if (form.vote_count) {
      formData.append("vote_count", form.vote_count);
    }
    if (form.original_language.trim()) {
      formData.append("original_language", form.original_language.trim());
    }
    if (form.runtime_minutes.trim() !== "") {
      formData.append("runtime_minutes", form.runtime_minutes.trim());
    }
    if (form.provider_name.trim()) {
      formData.append("provider_name", form.provider_name.trim());
    }
    if (form.production_status.trim()) {
      formData.append("production_status", form.production_status.trim());
    }
    const budgetValue = sanitizeNumberInput(form.budget.trim());
    const revenueValue = sanitizeNumberInput(form.revenue.trim());
    if (budgetValue) {
      formData.append("budget", budgetValue);
    }
    if (revenueValue) {
      formData.append("revenue", revenueValue);
    }
    if (form.poster_url.trim()) {
      formData.append("poster_url", form.poster_url.trim());
    }
    if (form.backdrop_url.trim()) {
      formData.append("backdrop_url", form.backdrop_url.trim());
    }
    if (form.trailer_url.trim()) {
      formData.append("trailer_url", form.trailer_url.trim());
    }
    formData.append("playback_protocol", form.playback_protocol);
    if (form.playback_protocol === "mp4") {
      if (form.progressive_url.trim()) {
        formData.append("progressive_url", form.progressive_url.trim());
      }
    } else if (form.hls_url.trim()) {
      formData.append("hls_url", form.hls_url.trim());
    }
    // Always send so clearing the field clears DB too.
    formData.append("subtitle_source_path", form.subtitle_source_path.trim());
    formData.append("dubbed_source_path", form.dubbed_audio_url.trim());
    formData.append("has_subtitle", form.has_subtitle ? "1" : "0");
    formData.append("has_dubbed_audio", form.has_dubbed_audio ? "1" : "0");
    formData.append("drm_scheme", form.drm_scheme || "none");
    if (form.drm_scheme !== "none" && form.drm_license_url.trim()) {
      formData.append("drm_license_url", form.drm_license_url.trim());
    }
    formData.append("is_featured", form.is_featured ? "1" : "0");
    formData.append("exclude_from_slider", form.is_featured ? "0" : "1");
    formData.append("catalog_visibility", form.catalog_visibility || "catalog_search");
    formData.append("admin_notes", form.admin_notes.trim());
    Object.entries(downloadLinks).forEach(([quality, url]) => {
      formData.append(`download_links[${quality}]`, url);
    });

    castMembers.forEach((value) => formData.append("cast_members[]", value));
    form.directors.forEach((value) => formData.append("directors[]", value));
    form.writers.forEach((value) => formData.append("writers[]", value));
    form.genres.forEach((value) => formData.append("genres[]", value));
    form.tags.forEach((value) => formData.append("tags[]", value));
    languageValuesForSave(form.languages).forEach((value) =>
      formData.append("languages[]", value),
    );
    countryLabelsForSave(form.countries, taxonomyCountries).forEach((value) =>
      formData.append("countries[]", value),
    );

    normalizedActors.forEach((actor, index) => {
      if (actor.name) {
        formData.append(`actors[${index}][name]`, actor.name);
      }
      if (actor.character) {
        formData.append(`actors[${index}][character]`, actor.character);
      }
      if (actor.profile_url) {
        formData.append(`actors[${index}][profile_url]`, actor.profile_url);
      }
    });

    normalizedActors.forEach((actor, index) => {
      if (actor.tmdb_person_id != null && actor.tmdb_person_id > 0) {
        formData.append(`cast[${index}][tmdb_person_id]`, String(actor.tmdb_person_id));
      }
      if (actor.name) {
        formData.append(`cast[${index}][name]`, actor.name);
      }
      if (actor.character) {
        formData.append(`cast[${index}][character]`, actor.character);
      }
      if (actor.profile_url) {
        formData.append(`cast[${index}][profile_url]`, actor.profile_url);
      }
      if (actor.credit_id) {
        formData.append(`cast[${index}][credit_id]`, actor.credit_id);
      }
      if (actor.order != null) {
        formData.append(`cast[${index}][order]`, String(actor.order));
      }
      if (actor.known_for_department) {
        formData.append(`cast[${index}][known_for_department]`, actor.known_for_department);
      }
    });

    formData.append("publish_status", publishStatus);
    if (publishStatus === "scheduled" && scheduledFor.trim()) {
      formData.append("scheduled_for", scheduledFor);
    }

    if (entryMode === "tmdb" && form.belongs_to_collection?.tmdb_collection_id) {
      formData.append(
        "belongs_to_collection[tmdb_collection_id]",
        String(form.belongs_to_collection.tmdb_collection_id),
      );
      if (form.belongs_to_collection.name) {
        formData.append("belongs_to_collection[name]", form.belongs_to_collection.name);
      }
      if (form.belongs_to_collection.poster_url) {
        formData.append(
          "belongs_to_collection[poster_url]",
          form.belongs_to_collection.poster_url,
        );
      }
      if (form.belongs_to_collection.backdrop_url) {
        formData.append(
          "belongs_to_collection[backdrop_url]",
          form.belongs_to_collection.backdrop_url,
        );
      }
    }

    form.crew.forEach((member, index) => {
      if (!member.name.trim()) {
        return;
      }
      if (member.tmdb_person_id != null && member.tmdb_person_id > 0) {
        formData.append(`crew[${index}][tmdb_person_id]`, String(member.tmdb_person_id));
      }
      formData.append(`crew[${index}][name]`, member.name.trim());
      if (member.job) {
        formData.append(`crew[${index}][job]`, member.job);
      }
      if (member.department) {
        formData.append(`crew[${index}][department]`, member.department);
      }
      if (member.profile_url) {
        formData.append(`crew[${index}][profile_url]`, member.profile_url);
      }
      if (member.credit_id) {
        formData.append(`crew[${index}][credit_id]`, member.credit_id);
      }
    });

    return formData;
  };


  const createPublishIdempotencyKey = () => {
    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    publishIdempotencyKeyRef.current = key;
    return key;
  };

  const completePublishStatusUpdate = async (movieId: number) => {
    const publishResponse = await adminMoviesService.updatePublishStatus(
      movieId,
      {
        publish_status: publishStatus,
        scheduled_for: publishStatus === "scheduled" ? scheduledFor : null,
      },
      { idempotencyKey: publishIdempotencyKeyRef.current || createPublishIdempotencyKey() },
    );

    if (publishResponse.success && publishResponse.data) {
      clearPendingMoviePublish(movieId);
      setPendingPublishVisible(false);
      return publishResponse.data.movie;
    }

    savePendingMoviePublish({
      movieId,
      targetStatus: publishStatus,
      scheduledFor: publishStatus === "scheduled" ? scheduledFor : null,
      pendingPublish: true,
      savedAt: new Date().toISOString(),
    });
    setPendingPublishVisible(true);
    setError(publishResponse.message || "به‌روزرسانی وضعیت انتشار انجام نشد.");
    return null;
  };

  const savePublishStatusOnly = async () => {
    if (!movie?.id) {
      return;
    }

    if (publishStatus === "scheduled" && !scheduledFor.trim()) {
      setError("برای انتشار زمان‌بندی‌شده، تاریخ انتشار را وارد کن.");
      setActiveTab("publish");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    createPublishIdempotencyKey();
    const updatedMovie = await completePublishStatusUpdate(movie.id);

    if (updatedMovie) {
      setMovie((current) => mergeMovieFromSaveResponse(current, updatedMovie));
      setPublishStatus(updatedMovie.publish_status);
      setScheduledFor(apiDateTimeToInputValue(updatedMovie.scheduled_for));
      const outcomeStatus: PublishOutcomeStatus = updatedMovie.publish_status;
      setPublishOutcomeStatus(outcomeStatus);
      setPublishOutcomeOpen(true);
      setActiveTab("publish");
      pendingNavigationRef.current = "/admin/content-management/movies";
      await Promise.all([
        revalidateAdminMoviesList(),
        revalidatePublicMoviePages(updatedMovie.slug, movie?.slug, form.slug),
      ]);
    }

    setSubmitting(false);
  };

  const handlePublishOutcomeClose = () => {
    setPublishOutcomeOpen(false);
    const nextPath = pendingNavigationRef.current;
    pendingNavigationRef.current = null;

    if (nextPath) {
      void Promise.all([
        revalidateAdminMoviesList(),
        revalidatePublicMoviePages(movie?.slug, form.slug),
      ]).finally(() => {
        if (mode === "create") {
          resetCreateEditorState();
            router.replace(nextPath);
            return;
        }

        router.replace(nextPath);
        router.refresh();
      });
    }
  };

  const handleSubmit = async () => {
    const resolvedSlug =
      form.slug.trim() ||
      buildSlug(
        form.original_title,
        form.title,
        form.tmdb_id ? `movie-${form.tmdb_id}` : null
      );

    if (entryMode === "tmdb" && !form.tmdb_query.trim()) {
      setError("ابتدا کد TMDB را وارد کن.");
      setActiveTab("details");
      return;
    }

    if (entryMode === "tmdb" && (tmdbAvailability.isTaken || tmdbAvailability.isChecking)) {
      const existingTitle = tmdbAvailability.existing?.title;
      setError(
        tmdbAvailability.isChecking
          ? "لطفاً تا پایان بررسی یکتایی کد TMDb صبر کنید."
          : existingTitle
            ? `این کد TMDb قبلاً برای «${existingTitle}» ثبت شده است.`
            : "این کد TMDb قبلاً ثبت شده است.",
      );
      setActiveTab("details");
      return;
    }

    if (!form.title.trim()) {
      setError("عنوان فیلم نباید خالی باشد.");
      setActiveTab("details");
      return;
    }

    const detailsIssues = validateMovieDetailsTab(form, buildSlug, entryMode);
    if (detailsIssues.length > 0) {
      setActiveTab("details");
      applyTabFieldIssues(detailsIssues);
      return;
    }

    const mediaIssues = validateMovieMediaTab(form, entryMode);
    if (mediaIssues.length > 0) {
      setActiveTab("media");
      applyTabFieldIssues(mediaIssues);
      return;
    }

    if (!resolvedSlug) {
      setError("slug باید مشخص باشد.");
      setActiveTab("details");
      return;
    }

    if (form.playback_protocol === "mp4") {
      if (
        form.progressive_url.trim() &&
        !isProgressiveVideoUrl(form.progressive_url)
      ) {
        setError("آدرس ویدیو مستقیم معتبر (MP4/MKV) را وارد کنید.");
        setActiveTab("media");
        setTabFieldErrors({
          progressive_url: "آدرس ویدیو مستقیم معتبر (MP4/MKV) را وارد کنید.",
        });
        return;
      }
    } else if (entryMode === "tmdb" && !form.hls_url.trim()) {
      setError("مسیر HLS اجباری است.");
      setActiveTab("media");
      setTabFieldErrors({ hls_url: "مسیر HLS را وارد کنید." });
      return;
    }

    if (entryMode === "tmdb" && !form.age_rating.trim()) {
      setError("درجه سنی اجباری است.");
      setActiveTab("details");
      return;
    }

    if (publishStatus === "scheduled" && !scheduledFor.trim()) {
      setError("برای انتشار زمان‌بندی‌شده، تاریخ انتشار را وارد کن.");
      setActiveTab("publish");
      return;
    }

    if (
      mode === "edit" &&
      movie?.id &&
      activeTab === "publish" &&
      fingerprintMovie(form) === fingerprintMovieRef.current
    ) {
      await savePublishStatusOnly();
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    let targetMovieId = movie?.id;
    let createdMovieIdInThisSubmit: number | null = null;

    try {
      if (mode === "create") {
        setSubmitStep("ایجاد رکورد اولیه فیلم...");
        console.time("movie:create");
        const createResponse = await adminMoviesService.create({
          title: form.title.trim(),
          original_title: form.original_title.trim() || form.title.trim(),
          slug: resolvedSlug,
          release_year: form.release_year ? Number(form.release_year) : null,
        });
        console.timeEnd("movie:create");

        if (!(createResponse.success && createResponse.data)) {
          const firstError = createResponse.errors
            ? Object.values(createResponse.errors)[0]?.[0]
            : undefined;
          setError(firstError || createResponse.message || "ایجاد اولیه فیلم انجام نشد.");
          return;
        }

        targetMovieId = createResponse.data.movie.id;
        createdMovieIdInThisSubmit = Number(targetMovieId);
        setMovie((current) => mergeMovieFromSaveResponse(current, createResponse.data!.movie));
      }

      if (!targetMovieId) {
        setError("شناسه فیلم برای ذخیره‌سازی پیدا نشد.");
        return;
      }

      setSubmitStep("ذخیره فرم...");
      console.time("movie:publication-form");
      const saveResponse = await adminMoviesService.updatePublicationFormWithFiles(
        targetMovieId,
        buildPublicationFormData()
      );
      console.timeEnd("movie:publication-form");

      if (!(saveResponse.success && saveResponse.data)) {
        if (createdMovieIdInThisSubmit != null) {
          try {
            await adminMoviesService.remove(createdMovieIdInThisSubmit);
          } catch {
            // Best-effort rollback so a failed create does not leave an orphan draft.
          }
          setMovie(null);
        }

        const firstError = saveResponse.errors
          ? Object.values(saveResponse.errors)[0]?.[0]
          : undefined;
        setError(firstError || saveResponse.message || "ذخیره فرم انجام نشد.");
        return;
      }

      const savedMovie = saveResponse.data.movie;
      setMovie((current) => mergeMovieFromSaveResponse(current, savedMovie));

      // Revalidate in background — never block navigation on cache refresh.
      void Promise.all([
        revalidateAdminMoviesList(),
        revalidatePublicMoviePages(savedMovie.slug, movie?.slug, form.slug),
      ]);

      // Pipeline always runs in queue after save — return to list with «در حال پردازش».
      if (mode === "create") {
        resetCreateEditorState();
      }
      router.push("/admin/content-management/movies");
      router.refresh();
    } catch (err) {
      if (createdMovieIdInThisSubmit != null) {
        try {
          await adminMoviesService.remove(createdMovieIdInThisSubmit);
        } catch {
          // Best-effort rollback.
        }
        setMovie(null);
      }
      setError(err instanceof Error ? err.message : "ذخیره فرم انجام نشد.");
    } finally {
      setSubmitting(false);
      setSubmitStep(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-[34px] border border-white/10 bg-white/[0.03]" />
        <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />
      </div>
    );
  }

  const playbackUrl =
    form.playback_protocol === "mp4"
      ? form.progressive_url ||
        movie?.metadata?.playback?.progressive_url ||
        ""
      : form.hls_url ||
        movie?.metadata?.playback?.hls_url ||
        movie?.media_asset?.master_playlist_url ||
        "";
  const isTmdbLoading = searchingTmdb || fetchingTmdb || ingestingTmdbImages;
  const previewPosterImage = movie?.poster_image ?? null;
  const previewBackdropImage = movie?.backdrop_image ?? null;
  const previewPosterSources = buildAdminPreviewImageSources(
    previewPosterImage,
    form.poster_url,
    form.poster_source_url,
    movie?.metadata?.tmdb?.poster_source_url,
    movie?.metadata?.tmdb?.poster_url,
    movie?.poster_url,
  );
  const previewBackdropSources = buildAdminPreviewImageSources(
    previewBackdropImage,
    form.backdrop_url,
    form.backdrop_source_url,
    movie?.metadata?.tmdb?.backdrop_source_url,
    movie?.metadata?.tmdb?.backdrop_url,
  );
  const previewPosterUrl = previewPosterSources.src ?? "";
  const previewPosterFallbackUrl = previewPosterSources.fallbackUrl;
  const previewBackdropUrl = previewBackdropSources.src ?? "";
  const previewBackdropFallbackUrl = previewBackdropSources.fallbackUrl;
  const productionStatusLabel =
    translateProductionStatus(form.production_status) ||
    form.production_status ||
    "وضعیت نامشخص";
  const publishStatusLabel = translatePublishStatus(publishStatus);
  const downloadLinkCount = form.download_links.filter(
    (link) => link.quality.trim() && link.url.trim(),
  ).length;

  return (
    <div className="space-y-6">
      <div ref={formTopRef} />
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.14),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.16))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
              <HiOutlineSparkles className="h-4 w-4" />
              فرم واحد پیش‌نویس و انتشار
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              {mode === "create" ? "ایجاد فیلم" : "ویرایش و انتشار فیلم"}
            </h2>
            <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
              کد عددی TMDB را وارد کن تا اطلاعات اصلی فیلم خودکار پر شود
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void Promise.all([
                  revalidateAdminMoviesList(),
                  revalidatePublicMoviePages(movie?.slug, form.slug),
                ]).finally(() => {
                  router.push("/admin/content-management/movies");
                  router.refresh();
                });
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              بازگشت
              <HiOutlineArrowLeft className="h-4 w-4" />
            </button>
            {movie?.slug ? (
              <Link
                href={`/movies/${movie.slug}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-5 py-3 text-sm font-semibold text-[#bfeaff] transition hover:bg-[#38bdf8]/16"
              >
                <HiOutlinePlay className="h-4 w-4" />
                مشاهده فیلم
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <PublishOutcomeModal
        open={publishOutcomeOpen}
        status={publishOutcomeStatus}
        onClose={handlePublishOutcomeClose}
      />

      {movie?.pipeline_status === "failed" ? (
        <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
          آخرین پردازش انتشار ناموفق بود. مشکل را برطرف کنید و دوباره ذخیره کنید.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {error}
        </div>
      ) : null}

      {searchMessage ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-3 text-sm text-[#bfeaff]">
          <HiOutlineCheckCircle className="h-5 w-5" />
          {searchMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
          <HiOutlineCheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-4 md:p-6">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              disabled={!canAccessTab(tab.key)}
              onClick={() => goToTab(tab.key)}
              className={`rounded-2xl px-4 py-2.5 text-sm transition ${
                activeTab === tab.key
                  ? "bg-[#f5c518] font-semibold text-black"
                  : "border border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
              } disabled:cursor-not-allowed disabled:opacity-55`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className={`grid gap-6 ${
            activeTab === "publish" ? "grid-cols-1" : "xl:grid-cols-[1.18fr_0.82fr]"
          }`}
        >
          <section className="space-y-6">
            {activeTab === "details" ? (
              <div className="space-y-5">
                <ContentEntryModeToggle
                  value={entryMode}
                  disabled={loading || submitting}
                  onChange={(nextMode) => {
                    setEntryMode(nextMode);
                    setError("");
                    setTabFieldErrors({});
                    tmdbImageIngestAbortRef.current?.abort();
                    tmdbImageIngestAbortRef.current = null;
                    latestTmdbRequestRef.current = `manual-${Date.now()}`;
                    setSearchingTmdb(false);
                    setFetchingTmdb(false);
                    setIngestingTmdbImages(false);
                    if (nextMode === "manual") {
                      setForm((current) => ({
                        ...current,
                        tmdb_query: "",
                        tmdb_id: "",
                        belongs_to_collection: null,
                      }));
                      setLastFetchedTmdbCode("");
                    }
                  }}
                />

                {!isManualMode ? (
                <FormFieldAnchor field="tmdb_id" error={tabFieldErrors.tmdb_id}>
                <div className="rounded-[28px] border border-[#38bdf8]/20 bg-[#38bdf8]/[0.06] p-5 space-y-4">
                  <TmdbTitleSearch
                    label="جستجوی عنوان فیلم در TMDB"
                    placeholder="نام فیلم را بنویسید…"
                    search={(query) => adminMoviesService.searchTmdb(query, "fa-IR", "movie")}
                    onSelect={(tmdbId) => {
                      const code = String(tmdbId);
                      setForm((current) => ({
                        ...current,
                        tmdb_query: code,
                      }));
                      setLastFetchedTmdbCode(code);
                      void fetchAndApplyTmdb(code);
                    }}
                  />

                  <div className="flex flex-col gap-4">
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                        <HiOutlineSearch className="h-4 w-4" />
                        کد TMDB
                      </span>
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.tmdb_query}
                        onChange={(event) => handleTmdbCodeChange(event.target.value)}
                        placeholder="مثلاً 550"
                        className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#38bdf8]/45"
                      />
                      <TmdbIdAvailabilityHint
                        status={tmdbAvailability.status}
                        existing={tmdbAvailability.existing}
                        entityKind="movie"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="rounded-full border border-white/10 bg-[#071019] px-3 py-1.5 text-[#dbe7ee]">
                        TMDB ID: {form.tmdb_id || "هنوز ست نشده"}
                      </span>
                      {mode === "edit" ? (
                        <button
                          type="button"
                          onClick={() => void handleManualTmdbSync()}
                          disabled={isTmdbLoading || !normalizeTmdbCodeInput(form.tmdb_query)}
                          className="rounded-full border border-[#38bdf8]/35 bg-[#38bdf8]/15 px-4 py-1.5 text-sm font-semibold text-[#8bdcff] transition hover:bg-[#38bdf8]/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isTmdbLoading ? "در حال همگام‌سازی..." : "همگام‌سازی از TMDB"}
                        </button>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-[#071019] px-3 py-1.5 text-[#dbe7ee]">
                          {isTmdbLoading
                            ? "در حال بارگذاری از TMDB..."
                            : "پس از وارد کردن کد TMDB، اطلاعات خودکار بارگذاری می‌شود"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                </FormFieldAnchor>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2">
                  <FormFieldAnchor field="title" error={tabFieldErrors.title}>
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">
                      نام / عنوان فارسی{" "}
                      <span className="text-[#f5c518]">*</span>
                    </span>
                    <input
                      value={form.title}
                      onChange={(event) => handleChange("title", event.target.value)}
                      className={`w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${formFieldBorderClass(Boolean(tabFieldErrors.title))}`}
                    />
                  </label>
                  </FormFieldAnchor>

                  <FormFieldAnchor field="original_title" error={tabFieldErrors.original_title}>
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">
                      نام اصلی {isManualMode ? <span className="text-[#f5c518]">*</span> : null}
                    </span>
                    <input
                      value={form.original_title}
                      onChange={(event) => handleChange("original_title", event.target.value)}
                      className={`w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${formFieldBorderClass(Boolean(tabFieldErrors.original_title))}`}
                    />
                  </label>
                  </FormFieldAnchor>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <FormFieldAnchor field="slug" error={tabFieldErrors.slug}>
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">
                      slug {isManualMode ? <span className="text-[#f5c518]">*</span> : null}
                    </span>
                    <input
                      value={form.slug}
                      onChange={(event) => handleChange("slug", event.target.value)}
                      dir="ltr"
                      className={`w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrInputClass} ${formFieldBorderClass(Boolean(tabFieldErrors.slug))}`}
                    />
                    <SlugAvailabilityHint
                      status={slugAvailability.status}
                      suggestion={slugAvailability.suggestion}
                      onApplySuggestion={(nextSlug) => handleChange("slug", nextSlug)}
                    />
                  </label>
                  </FormFieldAnchor>

                  <FormFieldAnchor field="release_year" error={tabFieldErrors.release_year}>
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">سال</span>
                    <input
                      value={form.release_year}
                      onChange={(event) => handleChange("release_year", event.target.value)}
                      className={`w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${formFieldBorderClass(Boolean(tabFieldErrors.release_year))}`}
                    />
                  </label>
                  </FormFieldAnchor>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">امتیاز</span>
                    <input
                      value={form.rating}
                      onChange={(event) => handleChange("rating", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">شرکت سازنده</span>
                    <input
                      value={form.provider_name}
                      onChange={(event) => handleChange("provider_name", event.target.value)}
                      placeholder="Warner Bros, Legendary, ..."
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">زبان اصلی</span>
                    <AdminSelect
                      value={form.original_language}
                      onChange={(value) => handleChange("original_language", value)}
                      options={originalLanguageSelectOptions}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">
                      مدت زمان (دقیقه){" "}
                      <span className="font-normal text-[#607684]">(اختیاری)</span>
                    </span>
                    <input
                      inputMode="numeric"
                      value={form.runtime_minutes}
                      onChange={(event) =>
                        handleChange(
                          "runtime_minutes",
                          event.target.value.replace(/[^\d]/g, ""),
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">وضعیت تولید (TMDB)</span>
                    <AdminSelect
                      value={form.production_status}
                      onChange={(value) => handleChange("production_status", value)}
                      options={productionStatusSelectOptions}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">بودجه</span>
                    <input
                      inputMode="numeric"
                      value={formatNumberWithCommas(form.budget)}
                      onChange={(event) =>
                        handleChange("budget", sanitizeNumberInput(event.target.value))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">فروش جهانی</span>
                    <input
                      inputMode="numeric"
                      value={formatNumberWithCommas(form.revenue)}
                      onChange={(event) =>
                        handleChange("revenue", sanitizeNumberInput(event.target.value))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>
                </div>

                <FormFieldAnchor field="age_rating" error={tabFieldErrors.age_rating}>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">
                    رده‌بندی سنی <span className="text-[#f5c518]">*</span>
                  </span>
                  <AdminSelect
                    value={form.age_rating}
                    onChange={(value) => handleChange("age_rating", value)}
                    options={ageRatingOptions}
                  />
                </label>
                </FormFieldAnchor>

                <ContentWarningsField
                  values={form.content_warnings}
                  onChange={(values) =>
                    setForm((current) => ({ ...current, content_warnings: values }))
                  }
                />

                <ExternalIdsSection
                  imdbId={form.imdb_id}
                  homepageUrl={form.homepage_url}
                  onImdbIdChange={(value) => handleChange("imdb_id", value)}
                  onHomepageUrlChange={(value) => handleChange("homepage_url", value)}
                />

                <FormFieldAnchor field="synopsis" error={tabFieldErrors.synopsis}>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">
                    خلاصه داستان {isManualMode ? <span className="text-[#f5c518]">*</span> : null}
                  </span>
                  <textarea
                    rows={6}
                    value={form.synopsis}
                    onChange={(event) => handleChange("synopsis", event.target.value)}
                    className={`w-full rounded-[26px] border bg-white/[0.04] px-4 py-3 text-sm leading-8 text-white outline-none transition focus:border-[#f5c518]/45 ${formFieldBorderClass(Boolean(tabFieldErrors.synopsis))}`}
                  />
                  {form.synopsis_en.trim() ? (
                    <p className="mt-2 text-xs leading-6 text-[#8ea4b3]">
                      متن انگلیسی TMDB: {form.synopsis_en}
                    </p>
                  ) : null}
                </label>
                </FormFieldAnchor>

                <div className="grid gap-4 lg:grid-cols-2">
                  <AdminTaxonomyMultiSelect
                    label="ژانرها"
                    options={genreSelectOptions}
                    value={form.genres}
                    onChange={(values) =>
                      setForm((current) => ({ ...current, genres: values }))
                    }
                    placeholder="انتخاب ژانر"
                    loading={taxonomyLoading}
                    required={isManualMode}
                    error={tabFieldErrors.genres}
                    fieldKey="genres"
                  />
                  <AdminTaxonomyMultiSelect
                    label="کشورها"
                    options={countrySelectOptions}
                    value={form.countries}
                    onChange={(values) =>
                      setForm((current) => ({ ...current, countries: values }))
                    }
                    placeholder="انتخاب کشور"
                    loading={taxonomyLoading}
                    columns={2}
                    required={isManualMode}
                    error={tabFieldErrors.countries}
                    fieldKey="countries"
                  />
                  <AdminTaxonomyMultiSelect
                    label="زبان‌ها"
                    options={languageSelectOptions}
                    value={form.languages}
                    onChange={(values) =>
                      setForm((current) => {
                        const nextOriginal =
                          current.original_language || values[0] || "";
                        return {
                          ...current,
                          languages: values,
                          original_language: nextOriginal,
                        };
                      })
                    }
                    placeholder="انتخاب زبان"
                    loading={taxonomyLoading}
                    columns={2}
                    required={isManualMode}
                    error={tabFieldErrors.languages}
                    fieldKey="languages"
                  />
                  {(Object.keys(freeArrayFieldLabels) as MovieEditorFreeArrayField[]).map(
                    (field) => (
                    <div
                      key={field}
                      data-form-field={field}
                      className={`rounded-[24px] border bg-white/[0.03] p-4 ${
                        tabFieldErrors[field]
                          ? "border-red-400/45 ring-1 ring-red-400/45"
                          : "border-white/10"
                      }`}
                    >
                      <p className="text-xs text-[#8ea4b3]">{freeArrayFieldLabels[field]}</p>

                      <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                        {form[field].length ? (
                          form[field].map((item, index) => {
                            const itemLabel = normalizeListItemLabel(item);

                            return (
                            <span
                              key={`${field}-${itemLabel || index}`}
                              className="group relative inline-flex items-center rounded-full border border-white/10 bg-[#071019] px-3 py-1 text-[11px] text-[#dde7ed]"
                            >
                              {itemLabel}
                              <button
                                type="button"
                                onClick={() => removeArrayItem(field, itemLabel)}
                                className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#fb7185]/30 bg-[#0b1720] text-[#fecdd3] opacity-0 transition group-hover:opacity-100"
                              >
                                <HiOutlineX className="h-3 w-3" />
                              </button>
                            </span>
                          );
                          })
                        ) : (
                          <span className="text-xs text-[#7f94a1]">آیتمی ثبت نشده</span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <input
                          value={listDrafts[field]}
                          onChange={(event) =>
                            setListDrafts((current) => ({
                              ...current,
                              [field]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleArrayInputSubmit(field);
                            }
                          }}
                          placeholder="آیتم جدید"
                          className="w-full rounded-2xl border border-white/10 bg-[#071019] px-3 py-2 text-xs text-white outline-none transition focus:border-[#f5c518]/45"
                        />
                        <button
                          type="button"
                          onClick={() => handleArrayInputSubmit(field)}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                        >
                          <HiOutlinePlus className="h-4 w-4" />
                        </button>
                      </div>
                      {tabFieldErrors[field] ? (
                        <p className="mt-2 text-xs font-medium text-red-300" role="alert">
                          {tabFieldErrors[field]}
                        </p>
                      ) : null}
                    </div>
                  ),
                  )}
                </div>

                <FormFieldAnchor field="actors" error={tabFieldErrors.actors}>
                <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">بازیگران</h3>
                    <button
                      type="button"
                      onClick={addActorRow}
                      className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      <HiOutlinePlus className="h-4 w-4" />
                      افزودن
                    </button>
                  </div>

                  {form.actors.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {form.actors.map((actor, actorIndex) => (
                        <div
                          key={`actor-row-${actorIndex}`}
                          className="group relative space-y-3 rounded-[20px] border border-white/10 bg-[#071019] p-3"
                        >
                          <p className="text-[11px] font-semibold text-[#8ea4b3]">
                            #{actorIndex + 1}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                              {actor.profile_url ? (
                                <img
                                  src={actor.profile_url}
                                  alt={actor.name || "Actor"}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#8ea4b3]">
                                  {(actor.name || "?").slice(0, 1)}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-2">
                              <input
                                dir={isManualMode ? "rtl" : "ltr"}
                                value={actor.name || ""}
                                onChange={(event) =>
                                  handleActorChange(actorIndex, "name", event.target.value)
                                }
                                placeholder={
                                  isManualMode
                                    ? "نام بازیگر"
                                    : "English name · e.g. Bradley Cooper"
                                }
                                className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none transition focus:border-[#f5c518]/45 ${isManualMode ? "" : ltrInputClass}`}
                              />
                              {!isManualMode && actor.name && !isLatinPersonName(actor.name) ? (
                                <p className="text-[10px] text-[#fca5a5]">
                                  نام باید انگلیسی باشد.
                                </p>
                              ) : null}
                              <input
                                value={actor.character || ""}
                                onChange={(event) =>
                                  handleActorChange(actorIndex, "character", event.target.value)
                                }
                                placeholder="نقش / کاراکتر"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#c7d5de] outline-none transition focus:border-[#f5c518]/45"
                              />
                            </div>
                          </div>

                          <AdminImageUrlField
                            label="تصویر بازیگر"
                            value={actor.profile_url || ""}
                            onChange={(value) =>
                              handleActorChange(actorIndex, "profile_url", value)
                            }
                            entityType="movie"
                            entityId={movie?.id ?? movieId ?? null}
                            imageRole="still"
                            uploadLabel="آپلود تصویر"
                            className={ltrLinkInputClass}
                          />

                          <button
                            type="button"
                            onClick={() => removeActorRow(actorIndex)}
                            className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#fb7185]/30 bg-[#0b1720] text-[#fecdd3] opacity-0 transition group-hover:opacity-100"
                          >
                            <HiOutlineX className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-white/12 bg-[#071019] px-4 py-5 text-sm text-[#8ea4b3]">
                      هنوز بازیگری ثبت نشده است. روی «افزودن» بزنید.
                    </div>
                  )}
                </div>
                </FormFieldAnchor>

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <button
                    type="button"
                    disabled
                    className="hidden rounded-2xl border border-[#f5c518]/30 bg-[#f5c518]/10 px-6 py-3 text-sm font-semibold text-[#f8d977] opacity-60"
                  >
                    مرحله اول
                  </button>
                  <button
                    type="button"
                    onClick={goToNextTab}
                    aria-disabled={!canProceedToNextTab}
                    className={`rounded-2xl border px-7 py-3 text-sm font-bold transition ${
                      canProceedToNextTab
                        ? "border-[#f5c518]/40 bg-[#f5c518] text-[#081018] hover:bg-[#e8bb0d]"
                        : "cursor-not-allowed border-white/10 bg-white/[0.06] text-[#607684] opacity-70"
                    }`}
                  >
                    تب بعدی
                  </button>
                </div>

              </div>
            ) : null}

            {activeTab === "media" ? (
              <div className="space-y-5">
                {isTmdbLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <TmdbSkeletonCard className="h-24 md:col-span-2" />
                    <TmdbSkeletonCard className="h-24" />
                    <TmdbSkeletonCard className="h-24" />
                  </div>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2">
                  <FormFieldAnchor field="poster_url" error={tabFieldErrors.poster_url}>
                  <AdminImageUrlField
                    label={isManualMode ? "پوستر *" : "پوستر"}
                    value={form.poster_url}
                    onChange={(value) => handleChange("poster_url", value)}
                    entityType="movie"
                    entityId={movie?.id ?? movieId ?? null}
                    imageRole="poster"
                    onUploaded={(result) => {
                      setMovie((current) =>
                        current
                          ? {
                              ...current,
                              poster_url: result.image_path,
                              poster_image: result.image ?? current.poster_image ?? null,
                            }
                          : current,
                      );
                    }}
                    className={ltrLinkInputClass}
                  />
                  </FormFieldAnchor>

                  <FormFieldAnchor field="backdrop_url" error={tabFieldErrors.backdrop_url}>
                  <AdminImageUrlField
                    label={isManualMode ? "تصویر پس‌زمینه *" : "تصویر پس‌زمینه"}
                    value={form.backdrop_url}
                    onChange={(value) => handleChange("backdrop_url", value)}
                    entityType="movie"
                    entityId={movie?.id ?? movieId ?? null}
                    imageRole="backdrop"
                    onUploaded={(result) => {
                      setMovie((current) =>
                        current
                          ? {
                              ...current,
                              backdrop_url: result.image_path,
                              backdrop_image: result.image ?? current.backdrop_image ?? null,
                            }
                          : current,
                      );
                    }}
                    className={ltrLinkInputClass}
                  />
                  </FormFieldAnchor>
                </div>

                <FormFieldAnchor field="trailer_url" error={tabFieldErrors.trailer_url}>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                    <HiOutlineVideoCamera className="h-4 w-4" />
                    لینک تریلر یوتیوب
                    <span className="font-normal text-[#607684]"> (اختیاری)</span>
                  </span>
                  <input
                    type="url"
                    dir="ltr"
                    value={form.trailer_url}
                    onChange={(event) => handleChange("trailer_url", event.target.value)}
                    className={`w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass} ${formFieldBorderClass(Boolean(tabFieldErrors.trailer_url))}`}
                  />
                </label>
                </FormFieldAnchor>

                <div
                  className={`relative rounded-[28px] border bg-white/[0.03] p-5 transition ${
                    hlsPreviewLoading
                      ? "border-[#38bdf8]/35 bg-[#38bdf8]/5"
                      : "border-white/10"
                  }`}
                >
                  {hlsPreviewLoading && form.playback_protocol === "hls" ? (
                    <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-3 text-sm text-[#bae6fd]">
                      <HiOutlineRefresh className="h-4 w-4 shrink-0 animate-spin" />
                      <span>در حال پردازش و بررسی پکیج HLS…</span>
                    </div>
                  ) : null}

                  <div className="mb-4">
                    <p className="mb-2 text-sm text-[#8ea4b3]">روش پخش فیلم</p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { value: "hls" as const, label: "HLS (پکیج m3u8)" },
                          { value: "mp4" as const, label: "ویدیو مستقیم MP4" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              playback_protocol: option.value,
                            }))
                          }
                          className={`rounded-2xl border px-4 py-2 text-xs font-semibold transition ${
                            form.playback_protocol === option.value
                              ? "border-[#f5c518]/45 bg-[#f5c518]/15 text-white"
                              : "border-white/10 bg-[#071019] text-[#c7d5de] hover:border-white/20"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {form.playback_protocol === "hls" ? (
                      <FormFieldAnchor field="hls_url" error={tabFieldErrors.hls_url} className="md:col-span-2">
                      <label className="block">
                        <span className="mb-2 block text-sm text-[#8ea4b3]">
                          مسیر HLS
                          {isManualMode ? null : <span className="text-[#f5c518]"> *</span>}
                        </span>
                        <input
                          type="text"
                          dir="ltr"
                          required={!isManualMode}
                          value={form.hls_url}
                          onChange={(event) => handleChange("hls_url", event.target.value)}
                          placeholder="پوشهٔ پکیج یا آدرس کامل master.m3u8"
                          className={`w-full rounded-2xl border bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass} ${formFieldBorderClass(Boolean(tabFieldErrors.hls_url), "border-white/10")}`}
                        />
                        {hlsSyncMessage ? (
                          <p className="mt-2 text-xs text-[#86efac]">{hlsSyncMessage}</p>
                        ) : null}
                      </label>
                      </FormFieldAnchor>
                    ) : (
                      <FormFieldAnchor field="progressive_url" error={tabFieldErrors.progressive_url} className="md:col-span-2">
                      <label className="block">
                        <span className="mb-2 block text-sm text-[#8ea4b3]">
                          آدرس ویدیو مستقیم (MP4/MKV)
                          <span className="font-normal text-[#607684]"> (اختیاری)</span>
                        </span>
                        <input
                          type="text"
                          dir="ltr"
                          value={form.progressive_url}
                          onChange={(event) =>
                            handleChange("progressive_url", event.target.value)
                          }
                          placeholder="https://cdn.example.com/movies/title/video.mkv"
                          className={`w-full rounded-2xl border bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass} ${formFieldBorderClass(Boolean(tabFieldErrors.progressive_url), "border-white/10")}`}
                        />
                        <p className="mt-2 text-xs text-[#8ea4b3]">
                          فایل progressive؛ بدون تبدیل به HLS پخش می‌شود.
                        </p>
                      </label>
                      </FormFieldAnchor>
                    )}

                    <PlaybackSubtitleDubFields
                      playbackProtocol={form.playback_protocol}
                      subtitleUrl={form.subtitle_source_path}
                      dubbedAudioUrl={form.dubbed_audio_url}
                      hasSubtitle={form.has_subtitle}
                      hasDubbed={form.has_dubbed_audio}
                      ltrInputClass={ltrLinkInputClass}
                      onSubtitleUrlChange={(value) => handleChange("subtitle_source_path", value)}
                      onDubbedAudioUrlChange={(value) => handleChange("dubbed_audio_url", value)}
                      onHasSubtitleChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          has_subtitle: value,
                        }))
                      }
                      onHasDubbedChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          has_dubbed_audio: value,
                        }))
                      }
                    />
                  </div>

                  {form.playback_protocol === "hls" ? (
                  <details className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <summary className="cursor-pointer text-sm font-semibold text-white">
                      تنظیمات DRM (اختیاری)
                    </summary>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm text-[#8ea4b3]">طرح DRM</span>
                        <select
                          value={form.drm_scheme}
                          onChange={(event) => {
                            const nextScheme = event.target.value;
                            setForm((current) => ({
                              ...current,
                              drm_scheme: nextScheme,
                              ...(nextScheme === "none"
                                ? { dash_url: "", drm_license_url: "" }
                                : {}),
                            }));
                          }}
                          className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                        >
                          <option value="none">بدون DRM</option>
                          <option value="widevine">Widevine (Chrome / Android / Fire TV)</option>
                          <option value="playready">PlayReady (Edge / Tizen / webOS)</option>
                          <option value="fairplay">FairPlay (Safari / iOS)</option>
                        </select>
                      </label>

                      {form.drm_scheme !== "none" ? (
                        <>
                        <label className="block md:col-span-2">
                          <span className="mb-2 block text-sm text-[#8ea4b3]">
                            آدرس سرور لایسنس DRM
                          </span>
                          <input
                            type="url"
                            dir="ltr"
                            value={form.drm_license_url}
                            onChange={(event) =>
                              handleChange("drm_license_url", event.target.value)
                            }
                            placeholder="https://license.example.com/widevine"
                            className={`w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                          />
                          <p className="mt-1 text-xs text-gray-400">
                            آدرس سرور لایسنس DRM ارائه‌دهنده شما (مثلاً BuyDRM، Axinom، Pallycon)
                          </p>
                        </label>
                        <label className="block md:col-span-2">
                          <span className="mb-2 block text-sm text-[#8ea4b3]">
                            DASH URL (اختیاری)
                          </span>
                          <input
                            type="text"
                            dir="ltr"
                            value={form.dash_url}
                            onChange={(event) => handleChange("dash_url", event.target.value)}
                            placeholder="https://cdn.example.com/movie/manifest.mpd"
                            className={`w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                          />
                          <p className="mt-2 text-xs text-[#8ea4b3]">
                            manifest.mpd برای پخش DRM — فقط وقتی طرح DRM فعال است لازم است
                          </p>
                        </label>
                        </>
                      ) : null}
                    </div>
                  </details>
                  ) : null}

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-white">
                        لینک‌های دانلود{" "}
                        <span className="font-normal text-[#8ea4b3]">(اختیاری)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={addDownloadLinkRow}
                        className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                      >
                        افزودن لینک
                      </button>
                    </div>

                    <div className="space-y-3">
                      {form.download_links.filter(Boolean).map((link, index) => (
                        <div
                          key={link?.id || `download-${index}`}
                          className="grid gap-3 rounded-[24px] border border-white/10 bg-[#071019] p-4 md:grid-cols-[180px_1fr_auto]"
                        >
                          <div dir="ltr" className={`min-w-0 ${ltrLinkInputClass}`}>
                            <AdminSelect
                              value={link.quality}
                              onChange={(value) =>
                                handleDownloadLinkChange(index, "quality", value)
                              }
                              options={downloadQualityOptions}
                              placeholder="انتخاب کیفیت"
                            />
                          </div>
                          <input
                            type="text"
                            dir="ltr"
                            value={link.url}
                            onChange={(event) =>
                              handleDownloadLinkChange(index, "url", event.target.value)
                            }
                            onPaste={(event) => handleDownloadLinkPaste(index, event)}
                            placeholder="مسیر فایل، URL کامل، یا پوشهٔ پکیج HLS"
                            className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeDownloadLinkRow(index)}
                            className="rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 px-4 py-3 text-xs font-semibold text-[#fecdd3] transition hover:bg-[#fb7185]/15"
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <button
                    type="button"
                    onClick={goToPreviousTab}
                    className="rounded-2xl border border-[#f5c518]/40 bg-[#f5c518] px-7 py-3 text-sm font-bold text-[#081018] transition hover:bg-[#e8bb0d]"
                  >
                    تب قبلی
                  </button>
                  <button
                    type="button"
                    onClick={goToNextTab}
                    aria-disabled={!canProceedToNextTab}
                    className={`rounded-2xl border px-7 py-3 text-sm font-bold transition ${
                      canProceedToNextTab
                        ? "border-[#f5c518]/40 bg-[#f5c518] text-[#081018] hover:bg-[#e8bb0d]"
                        : "cursor-not-allowed border-white/10 bg-white/[0.06] text-[#607684] opacity-70"
                    }`}
                  >
                    تب بعدی
                  </button>
                </div>
              </div>
            ) : null}

            {activeTab === "seo" ? (
              <div className="space-y-5">
                <SeoFieldsPanel
                  title={form.title}
                  synopsis={form.synopsis}
                  slug={form.slug}
                  metaTitle={form.meta_title}
                  metaDescription={form.meta_description}
                  onMetaTitleChange={(value) => handleChange("meta_title", value)}
                  onMetaDescriptionChange={(value) => handleChange("meta_description", value)}
                />

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <button
                    type="button"
                    onClick={goToPreviousTab}
                    className="rounded-2xl border border-[#f5c518]/40 bg-[#f5c518] px-7 py-3 text-sm font-bold text-[#081018] transition hover:bg-[#e8bb0d]"
                  >
                    تب قبلی
                  </button>
                  <button
                    type="button"
                    onClick={goToNextTab}
                    aria-disabled={!canProceedToNextTab}
                    className={`rounded-2xl border px-7 py-3 text-sm font-bold transition ${
                      canProceedToNextTab
                        ? "border-[#f5c518]/40 bg-[#f5c518] text-[#081018] hover:bg-[#e8bb0d]"
                        : "cursor-not-allowed border-white/10 bg-white/[0.06] text-[#607684] opacity-70"
                    }`}
                  >
                    تب بعدی
                  </button>
                </div>
              </div>
            ) : null}

            {activeTab === "publish" ? (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={goToPreviousTab}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  تب قبلی
                </button>

                <div className="rounded-[28px] border border-[#f5c518]/35 bg-[#f5c518]/8 p-5 shadow-[0_0_0_1px_rgba(245,197,24,0.08)]">
                  <p className="mb-4 text-base font-bold text-[#f5c518]">وضعیت انتشار</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">
                        انتخاب وضعیت
                      </span>
                      <AdminSelect
                        value={publishStatus}
                        onChange={(value) => {
                          const nextStatus = value as PublishStatus;
                          setPublishStatus(nextStatus);
                          if (nextStatus !== "scheduled") {
                            setScheduledFor("");
                          }
                        }}
                        options={moviePublishStatusOptions}
                      />
                    </label>
                    {publishStatus === "scheduled" ? (
                      <AdminScheduleDateTimePicker
                        label="زمان انتشار"
                        value={scheduledFor}
                        onChange={setScheduledFor}
                        minDateTime={toDateTimeInputValue(new Date())}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        نمایش در اسلایدر صفحه اصلی
                      </span>
                      <span className="mt-1 block text-xs text-[#8ea4b3]">
                        این فیلم در ابتدای اسلایدر HomeHero (حداکثر ۸ مورد) قرار می‌گیرد.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          is_featured: event.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#f5c518]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">نمایش در کاتالوگ</span>
                    <AdminSelect
                      value={form.catalog_visibility}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          catalog_visibility: value,
                        }))
                      }
                      options={movieCatalogVisibilityOptions}
                    />
                  </label>
                </div>

                <MovieFormStatusPanel
                  title={form.title}
                  originalTitle={form.original_title}
                  synopsis={form.synopsis}
                  slug={`/${form.slug || buildSlug(form.original_title, form.title, form.tmdb_id ? `movie-${form.tmdb_id}` : null) || "movie-slug"}`}
                  posterUrl={previewPosterUrl}
                  backdropUrl={previewBackdropUrl}
                  releaseYear={form.release_year}
                  rating={form.rating}
                  ageRating={form.age_rating}
                  runtimeMinutes={form.runtime_minutes}
                  productionStatusLabel={productionStatusLabel}
                  publishStatusLabel={publishStatusLabel}
                  publishStatus={publishStatus}
                  scheduledFor={scheduledFor}
                  directors={form.directors}
                  writers={form.writers}
                  genres={form.genres}
                  tags={form.tags}
                  languages={form.languages}
                  countries={form.countries}
                  actors={extractActorNames(form.actors)}
                  downloadCount={downloadLinkCount}
                  playbackReady={Boolean(playbackUrl.trim())}
                  hasSubtitle={form.has_subtitle || Boolean(form.subtitle_source_path.trim())}
                  hasDubbed={
                    form.has_dubbed_audio ||
                    Boolean(form.dubbed_audio_url.trim()) ||
                    form.tags.some((tag) => /dub|دوبله/i.test(tag))
                  }
                />

                {pendingPublishVisible && mode === "edit" ? (
                  <PendingPublishBanner
                    loading={submitting}
                    onRetry={() => void savePublishStatusOnly()}
                  />
                ) : null}

                <label className="block rounded-[28px] border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-5">
                  <span className="mb-2 block text-sm text-[#fde68a]">
                    یادداشت داخلی (فقط برای ادمین‌ها)
                  </span>
                  <textarea
                    value={form.admin_notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        admin_notes: event.target.value.slice(0, 2000),
                      }))
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f59e0b]/45"
                    placeholder="یادداشت داخلی برای تیم..."
                  />
                  <span className="mt-2 block text-xs text-[#8ea4b3]">
                    {form.admin_notes.length}/2000
                  </span>
                </label>

                <div className="flex flex-wrap gap-3">
                  {mode === "edit" && movie?.id ? (
                    <button
                      type="button"
                      disabled={previewLoading}
                      onClick={() => {
                        void (async () => {
                          if (!movie?.id) return;
                          setPreviewLoading(true);
                          try {
                            const response = await adminMoviesService.getPreviewToken(movie.id);
                            const token = response.data?.token;
                            const slug =
                              form.slug.trim() ||
                              buildSlug(
                                form.original_title,
                                form.title,
                                form.tmdb_id ? `movie-${form.tmdb_id}` : null,
                              );
                            if (response.success && token && slug) {
                              window.open(`/movies/${slug}?preview=${token}`, "_blank");
                            } else {
                              setError(response.message || "صدور توکن پیش‌نمایش انجام نشد.");
                            }
                          } finally {
                            setPreviewLoading(false);
                          }
                        })();
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                    >
                      {previewLoading ? "در حال آماده‌سازی..." : "پیش‌نمایش"}
                    </button>
                  ) : null}
                </div>

                {mode === "edit" && movie?.id ? (
                  <ContentChangeHistoryPanel
                    entityLabel="فیلم"
                    loadHistory={async (page = 1) => {
                      const response = await adminMoviesService.getHistory(movie.id, page);
                      if (response.success && response.data) {
                        return response.data;
                      }
                      return null;
                    }}
                  />
                ) : null}

                <EditorPublishSubmitBar
                  onSubmit={() => void handleSubmit()}
                  disabled={!canSubmitForm}
                  loading={submitting}
                  label={submitting ? submitStep || "در حال ثبت..." : "ثبت نهایی"}
                  hint={
                    submitting && submitStep
                      ? submitStep
                      : mode === "edit" &&
                          fingerprintMovie(form) === fingerprintMovieRef.current
                        ? "فقط وضعیت انتشار و زمان‌بندی ذخیره می‌شود (سریع)."
                        : "تمام اطلاعات فیلم و وضعیت انتشار ذخیره می‌شود."
                  }
                />
              </div>
            ) : null}
          </section>

          <aside className={`${activeTab === "publish" ? "hidden" : "space-y-6"}`}>
            <section className="rounded-[32px] border border-white/10 bg-[#071019] p-5">
              <h3 className="text-lg font-bold text-white">پیش‌نمایش سریع</h3>
              <div className="mt-4 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03]">
                {isTmdbLoading ? (
                  <TmdbPreviewSkeleton className="rounded-none border-0" heightClass="h-[26rem]" />
                ) : previewBackdropUrl ||
                  previewBackdropFallbackUrl ||
                  previewPosterUrl ||
                  previewPosterFallbackUrl ? (
                  <div className="relative h-[26rem] overflow-hidden">
                    {previewBackdropUrl || previewBackdropFallbackUrl || previewBackdropImage ? (
                      <div className="absolute inset-0">
                        <BackdropImage
                          title={form.title || "Movie"}
                          image={previewBackdropImage}
                          src={previewBackdropUrl}
                          fallbackUrl={previewBackdropFallbackUrl}
                          allowRemoteFallback
                          usage="detail-backdrop"
                        />
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,25,0.08),rgba(7,16,25,0.88)_62%,rgba(7,16,25,0.98))]" />
                    <div className="relative flex h-full flex-col justify-end p-5">
                      <div className="flex items-end gap-4">
                        <div className="h-40 w-28 overflow-hidden rounded-[22px] border border-white/10 bg-[#071019] shadow-[0_20px_40px_rgba(0,0,0,0.32)]">
                          {previewPosterUrl || previewPosterFallbackUrl || previewPosterImage ? (
                            <PosterImage
                              title={form.title || "Movie"}
                              image={previewPosterImage}
                              src={previewPosterUrl}
                              fallbackUrl={previewPosterFallbackUrl}
                              allowRemoteFallback
                              usage="detail-poster"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[#8ea4b3]">
                              No poster
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mt-2 text-lg font-bold text-white">
                            {form.title || form.original_title || "Movie title"}
                          </p>
                          <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#d6e2e9]">
                            {form.synopsis ||
                              "اگر خلاصه هنوز تکمیل نشده، با وارد کردن TMDB یا ویرایش دستی این بخش پر می‌شود."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[26rem] items-center justify-center px-6 text-center text-sm text-[#8ea4b3]">
                    هنوز پوستری برای پیش‌نمایش ثبت نشده است. با کد TMDB یا لینک مستقیم، پوستر و
                    بک‌دراپ را اینجا می‌بینی.
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">عنوان</p>
                  <p className="mt-2 font-semibold text-white">{form.title || "ثبت نشده"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">slug</p>
                  <p className="mt-2 break-all font-semibold text-white">
                    /{form.slug || "movie-slug"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">پخش</p>
                  <p className="mt-2 break-all font-semibold text-white">
                    {playbackUrl ||
                      (form.playback_protocol === "mp4"
                        ? "هنوز آدرس MP4 ثبت نشده"
                        : "هنوز مسیر HLS ثبت نشده")}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}



