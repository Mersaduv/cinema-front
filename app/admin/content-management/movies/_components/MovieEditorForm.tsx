"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlinePhotograph,
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
import PublishOutcomeModal, {
  type PublishOutcomeStatus,
} from "../../../../components/admin/PublishOutcomeModal";
import TmdbPreviewSkeleton from "../../../../components/admin/TmdbPreviewSkeleton";
import { BackdropImage, PosterImage } from "../../../../components/images";

import { sortCastByOrder, sortCastRows } from "../../../../lib/cast-utils";
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
  type AdminMovie,
  type PublishStatus,
  type TmdbActor,
  type TmdbBelongsToCollection,
  type TmdbMoviePayload,
} from "../../../../lib/admin-movies";
import { apiDateTimeToInputValue, toDateTimeInputValue } from "../../../../lib/date-format";
import { localizeGenreLabels } from "../../../../lib/genre-labels";
import {
  mergeSeasonEpisodeSynopsisFromTmdb,
  normalizeSeasonEpisodeSynopsis,
  resolveTmdbMainSynopsis,
} from "../../../../lib/series-synopsis-helper";
import { normalizeListItemLabel, normalizeStringList } from "../../../../lib/list-item-label";
import {
  buildMovieTmdbImageIngestPayload,
  finalizeTmdbImageIngestMessage,
  mergeIngestedActorProfiles,
  withTmdbImageProcessingMessage,
} from "../../../../lib/admin-tmdb-image-ingest";
import { pickAdminPreviewImageSrc } from "../../../../lib/cinema-image";
import {
  inferDownloadQualityFromPath,
  looksLikeHlsPackagePath,
  normalizeDownloadLinkInput,
  normalizeMediaLinkInput,
} from "../../../../lib/media-link-input";
import {
  productionStatusSelectOptions,
  translateProductionStatus,
  translatePublishStatus,
} from "../../../../lib/production-status";

type Mode = "create" | "edit";
type EditorTab = "details" | "media" | "publish";

function movieFormBodyFingerprint(form: MovieEditorFormState): string {
  return JSON.stringify(form);
}

const ageRatingOptions = [
  { value: "", label: "بدون درجه سنی", description: "در صورت نیاز بعداً تعیین می‌شود" },
  { value: "G", label: "G", description: "مناسب همه سنین" },
  { value: "PG", label: "PG", description: "تماشا با راهنمایی والدین" },
  { value: "PG-13", label: "PG-13", description: "مناسب 13 سال به بالا" },
  { value: "R", label: "R", description: "نیازمند محدودیت سنی" },
  { value: "18+", label: "18+", description: "ویژه بزرگسالان" },
];

const tabs: Array<{ key: EditorTab; label: string }> = [
  { key: "details", label: "جزئیات" },
  { key: "media", label: "لینک‌ها" },
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
  rating: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url: string;
  hls_url: string;
  subtitle_source_path: string;
  dubbed_audio_url: string;
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
>;

type MovieEditorArrayField = Extract<
  keyof MovieEditorFormState,
  "genres" | "tags" | "languages" | "countries" | "directors" | "writers"
>;

const arrayFieldLabels: Record<MovieEditorArrayField, string> = {
  directors: "کارگردان‌ها",
  writers: "نویسنده‌ها",
  genres: "ژانرها",
  tags: "برچسب‌ها",
  languages: "زبان‌ها",
  countries: "کشورها",
};

const tabOrder: EditorTab[] = ["details", "media", "publish"];

const moviePublishStatusOptions = [
  { value: "draft", label: "پیش نویس", description: "در سایت عمومی نمایش داده نمی شود" },
  { value: "scheduled", label: "زمان بندی شده", description: "در زمان تعیین شده منتشر می شود" },
  { value: "published", label: "منتشر شده", description: "اکنون در سایت قابل مشاهده است" },
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
    rating: "",
    poster_url: "",
    backdrop_url: "",
    trailer_url: "",
    hls_url: "",
    subtitle_source_path: "",
    dubbed_audio_url: "",
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
}: {
  mode: Mode;
  movieId?: string;
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
  const [successMessage, setSuccessMessage] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [lastFetchedTmdbCode, setLastFetchedTmdbCode] = useState("");
  const [listDrafts, setListDrafts] = useState<Record<MovieEditorArrayField, string>>({
    directors: "",
    writers: "",
    genres: "",
    tags: "",
    languages: "",
    countries: "",
  });
  const latestTmdbRequestRef = useRef("");
  const tmdbImageIngestAbortRef = useRef<AbortController | null>(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);
  const movieFormBodyFingerprintRef = useRef("");
  const pendingNavigationRef = useRef<string | null>(null);
  const hlsPreviewGenerationRef = useRef(0);
  const [form, setForm] = useState<MovieEditorFormState>(createInitialFormState);
  const [hlsSyncMessage, setHlsSyncMessage] = useState("");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("draft");
  const [scheduledFor, setScheduledFor] = useState("");

  const sortedActorsWithIndex = useMemo(() => {
    const rows = form.actors
      .map((actor, index) => {
        const normalized = normalizeActor(actor);

        return normalized ? { actor: normalized, index } : null;
      })
      .filter((row): row is { actor: TmdbActor; index: number } => row !== null);

    return sortCastRows(rows, (row) => row.actor);
  }, [form.actors]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      if (mode === "edit" && movieId) {
        const movieResponse = await adminMoviesService.show(movieId);

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
          age_rating: nextMovie.age_rating || "",
          release_year: nextMovie.release_year ? String(nextMovie.release_year) : "",
          tmdb_id: nextMovie.metadata?.tmdb?.tmdb_id
            ? String(nextMovie.metadata.tmdb.tmdb_id)
            : "",
          imdb_id: nextMovie.metadata?.tmdb?.imdb_id || "",
          rating:
            typeof nextMovie.metadata?.tmdb?.rating === "number"
              ? String(nextMovie.metadata.tmdb.rating)
              : "",
          poster_url:
            nextMovie.poster_image?.original?.startsWith("/images/")
              ? nextMovie.poster_image.original.split("?")[0]
              : nextMovie.metadata?.tmdb?.poster_url || nextMovie.poster_url || "",
          backdrop_url:
            nextMovie.backdrop_image?.original?.startsWith("/images/")
              ? nextMovie.backdrop_image.original.split("?")[0]
              : nextMovie.metadata?.tmdb?.backdrop_url || "",
          trailer_url:
            nextMovie.metadata?.tmdb?.trailer_url || nextMovie.trailer_url || "",
          hls_url:
            nextMovie.metadata?.playback?.hls_url ||
            nextMovie.media_asset?.master_playlist_url ||
            "",
          subtitle_source_path:
            nextMovie.subtitle_source_url || nextMovie.subtitle_source_path || "",
          dubbed_audio_url: nextMovie.dubbed_source_url || "",
          download_links: Object.entries(nextMovie.metadata?.playback?.downloads || {}).length
            ? Object.entries(nextMovie.metadata?.playback?.downloads || {}).map(([quality, url]) =>
                createDownloadLinkRow(quality, url, `download-${quality}`),
              )
            : [createDownloadLinkRow()],
          original_language: nextMovie.metadata?.tmdb?.original_language || "",
          runtime_minutes: nextMovie.metadata?.tmdb?.runtime_minutes
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
          genres: localizeGenreLabels(nextMovie.metadata?.tmdb?.genres || []),
          tags: normalizeStringList(nextMovie.metadata?.tmdb?.tags || []),
          languages: normalizeStringList(nextMovie.metadata?.tmdb?.languages || []),
          countries: normalizeStringList(nextMovie.metadata?.tmdb?.countries || []),
          actors: initialActors,
          crew: initialCrew,
        };
        setForm(loadedForm);
        setLastFetchedTmdbCode(
          normalizeTmdbCodeInput(loadedForm.tmdb_id || loadedForm.tmdb_query),
        );
        movieFormBodyFingerprintRef.current = movieFormBodyFingerprint(loadedForm);
        setPublishStatus(nextMovie.publish_status || "draft");
        setScheduledFor(apiDateTimeToInputValue(nextMovie.scheduled_for));
      }

      setLoading(false);
    };

    if (mode === "create" || movieId) {
      void loadData();
    }
  }, [mode, movieId]);

  useEffect(() => {
    if (mode !== "create" || loading) {
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
  }, [form.tmdb_query, mode, loading, lastFetchedTmdbCode]);

  const handleChange = (field: MovieEditorTextField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addArrayItems = (field: MovieEditorArrayField, rawValue: string) => {
    const parsed = parseTagInput(rawValue);
    const personFields: MovieEditorArrayField[] = ["directors", "writers"];
    const nextItems = personFields.includes(field)
      ? filterLatinPersonNameList(parsed)
      : field === "genres"
        ? localizeGenreLabels(parsed)
        : normalizeStringList(parsed);

    if (!nextItems.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: Array.from(new Set([...(current[field] || []), ...nextItems])),
    }));
  };

  const removeArrayItem = (field: MovieEditorArrayField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter(
        (item) => normalizeListItemLabel(item) !== value,
      ),
    }));
  };

  const handleArrayInputSubmit = (field: MovieEditorArrayField) => {
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
      field === "name" ? sanitizeLatinPersonName(value) || null : value || null;

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
          name: null,
          character: null,
          profile_url: null,
          tmdb_person_id: null,
          credit_id: null,
          order: null,
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

    const response = await adminMoviesService.previewHlsPackage(normalized, {
      resolveDownloads: true,
    });

    if (!(response.success && response.data)) {
      setError(response.message || "شناسایی لینک‌های دانلود از پکیج انجام نشد.");
      return;
    }

    applyHlsPackageInsights(response.data);
    setHlsSyncMessage(
      response.data.download_links && Object.keys(response.data.download_links).length > 0
        ? "لینک‌های دانلود از پکیج HLS شناسایی شدند."
        : "پکیج HLS بررسی شد؛ لینک دانلود جداگانه‌ای پیدا نشد.",
    );
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

  const isDetailsTabComplete =
    form.tmdb_id.trim() !== "" &&
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
    form.writers.length > 0 &&
    normalizeActors(form.actors).length > 0;

  const isMediaTabComplete =
    form.poster_url.trim() !== "" &&
    form.backdrop_url.trim() !== "" &&
    form.trailer_url.trim() !== "" &&
    form.hls_url.trim() !== "";

  const canProceedToNextTab =
    activeTab === "details"
      ? isDetailsTabComplete
      : activeTab === "media"
        ? isMediaTabComplete
        : false;

  const canSubmitForm = isDetailsTabComplete && isMediaTabComplete;

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
    return isDetailsTabComplete && isMediaTabComplete;
  };

  const goToTab = (target: EditorTab) => {
    if (!canAccessTab(target)) {
      setError(
        target === "media"
          ? "ابتدا مرحله جزئیات را کامل کن."
          : "ابتدا مراحل جزئیات و لینک‌ها را کامل کن."
      );
      return;
    }
    setActiveTab(target);
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

    if (!canProceedToNextTab) {
      setError(
        activeTab === "details"
          ? "ابتدا فیلدهای اصلی این تب مثل عنوان، خلاصه، کارگردان، نویسنده و بازیگران را کامل کن."
          : "ابتدا لینک‌های اصلی این تب مثل پوستر، بنر، تریلر و HLS را کامل کن."
      );
      return;
    }

    goToTab(tabOrder[currentIndex + 1]);
  };

  const applyTmdbMovie = (payload: TmdbMoviePayload, query: string) => {
    const nextTitle = payload.title || payload.original_title || form.title;
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

    setForm((current) => ({
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
          payload.tmdb_id ? `movie-${payload.tmdb_id}` : null
        ) || current.slug,
      ...mergeSeasonEpisodeSynopsisFromTmdb(
        resolveTmdbMainSynopsis(payload),
        payload.synopsis_en,
        current.synopsis,
        current.synopsis_en,
      ),
      release_year: payload.release_year ? String(payload.release_year) : current.release_year,
      tmdb_id: payload.tmdb_id ? String(payload.tmdb_id) : current.tmdb_id,
      imdb_id: payload.imdb_id || current.imdb_id,
      rating: typeof payload.rating === "number" ? String(payload.rating) : current.rating,
      poster_url: payload.poster_url || current.poster_url,
      backdrop_url: payload.backdrop_url || current.backdrop_url,
      trailer_url: payload.trailer_url || current.trailer_url,
      age_rating: payload.age_rating || current.age_rating,
      original_language: payload.original_language || current.original_language,
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
        ? localizeGenreLabels(payload.genres)
        : current.genres,
      tags: payload.tags?.length ? normalizeStringList(payload.tags) : current.tags,
      languages: payload.languages?.length
        ? normalizeStringList(payload.languages)
        : current.languages,
      countries: payload.countries?.length
        ? normalizeStringList(payload.countries)
        : current.countries,
      actors: nextActors,
      crew: nextCrew.length ? nextCrew : current.crew,
      belongs_to_collection: payload.belongs_to_collection ?? null,
    }));

    setActiveTab("details");
  };

  async function ingestTmdbImagesAfterSync(payload: TmdbMoviePayload) {
    tmdbImageIngestAbortRef.current?.abort();
    const abortController = new AbortController();
    tmdbImageIngestAbortRef.current = abortController;
    const { signal } = abortController;

    setIngestingTmdbImages(true);
    setSearchMessage((current) =>
      withTmdbImageProcessingMessage(current, "پردازش تصاویر در حال انجام است."),
    );

    try {
      const response = await adminMoviesService.ingestTmdbImages(
        buildMovieTmdbImageIngestPayload(payload, movie?.id ?? movieId ?? null),
        { signal },
      );

      if (signal.aborted || !response.success || !response.data) {
        return;
      }

      const data = response.data;

      setForm((current) => ({
        ...current,
        poster_url:
          data.poster_url?.startsWith("/images/") ? data.poster_url : current.poster_url,
        backdrop_url:
          data.backdrop_url?.startsWith("/images/") ? data.backdrop_url : current.backdrop_url,
        actors: data.actors?.length
          ? mergeIngestedActorProfiles(current.actors, data.actors)
          : current.actors,
      }));

      if ((data.stats?.succeeded ?? 0) > 0) {
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
    const requestKey = String(tmdbId);
    latestTmdbRequestRef.current = requestKey;
    setFetchingTmdb(true);
    setError("");

    const response = await adminMoviesService.fetchTmdb(tmdbId);

    if (latestTmdbRequestRef.current !== requestKey) {
      setFetchingTmdb(false);
      return;
    }

    if (response.success && response.data) {
      applyTmdbMovie(response.data.movie, requestKey);
      setLastFetchedTmdbCode(String(response.data.movie.tmdb_id ?? requestKey));
      setSearchMessage(
        nextMessage || "اطلاعات فیلم از TMDB روی فرم اعمال شد؛ پردازش تصاویر در حال انجام است.",
      );
      void ingestTmdbImagesAfterSync(response.data.movie);
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
    const raw = form.hls_url.trim();

    if (!raw) {
      setHlsSyncMessage("");
      return;
    }

    const timer = window.setTimeout(async () => {
      const generation = ++hlsPreviewGenerationRef.current;
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
      applyHlsPackageInsights(payload, { mergeDownloads: false });

      setHlsSyncMessage(
        payload.download_links && Object.keys(payload.download_links).length > 0
          ? "زیرنویس، دوبله و لینک‌های دانلود از پکیج HLS همگام شد."
          : "زیرنویس و دوبله از پکیج HLS همگام شد.",
      );
    }, 650);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form.hls_url]);

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

    if (form.original_title.trim()) {
      formData.append("original_title", form.original_title.trim());
    }
    if (form.synopsis.trim()) {
      formData.append("synopsis", form.synopsis.trim());
    }
    if (form.age_rating) {
      formData.append("age_rating", form.age_rating);
    }
    if (form.release_year) {
      formData.append("release_year", form.release_year);
    }
    if (form.tmdb_id) {
      formData.append("tmdb_id", form.tmdb_id);
    }
    if (form.imdb_id.trim()) {
      formData.append("imdb_id", form.imdb_id.trim());
    }
    if (form.tmdb_query.trim()) {
      formData.append("tmdb_query", form.tmdb_query.trim());
    }
    if (form.rating) {
      formData.append("rating", form.rating);
    }
    if (form.original_language.trim()) {
      formData.append("original_language", form.original_language.trim());
    }
    if (form.runtime_minutes.trim()) {
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
    if (form.hls_url.trim()) {
      formData.append("hls_url", form.hls_url.trim());
    }
    if (form.subtitle_source_path.trim()) {
      formData.append("subtitle_source_path", form.subtitle_source_path.trim());
    }
    Object.entries(downloadLinks).forEach(([quality, url]) => {
      formData.append(`download_links[${quality}]`, url);
    });

    castMembers.forEach((value) => formData.append("cast_members[]", value));
    form.directors.forEach((value) => formData.append("directors[]", value));
    form.writers.forEach((value) => formData.append("writers[]", value));
    form.genres.forEach((value) => formData.append("genres[]", value));
    form.tags.forEach((value) => formData.append("tags[]", value));
    form.languages.forEach((value) => formData.append("languages[]", value));
    form.countries.forEach((value) => formData.append("countries[]", value));

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

    if (form.belongs_to_collection?.tmdb_collection_id) {
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

    const publishResponse = await adminMoviesService.updatePublishStatus(movie.id, {
      publish_status: publishStatus,
      scheduled_for: publishStatus === "scheduled" ? scheduledFor : null,
    });

    if (publishResponse.success && publishResponse.data) {
      const updatedMovie = publishResponse.data.movie;
      setMovie(updatedMovie);
      setPublishStatus(updatedMovie.publish_status);
      setScheduledFor(apiDateTimeToInputValue(updatedMovie.scheduled_for));
      const outcomeStatus: PublishOutcomeStatus = updatedMovie.publish_status;
      setPublishOutcomeStatus(outcomeStatus);
      setPublishOutcomeOpen(true);
      setActiveTab("publish");
      pendingNavigationRef.current = "/admin/content-management/movies";
      void Promise.all([
        revalidateAdminMoviesList(),
        revalidatePublicMoviePages(updatedMovie.slug, movie?.slug, form.slug),
      ]);
    } else {
      setError(publishResponse.message || "ذخیره وضعیت انتشار انجام نشد.");
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

    if (!form.tmdb_query.trim()) {
      setError("ابتدا کد TMDB را وارد کن.");
      setActiveTab("details");
      return;
    }

    if (!form.title.trim()) {
      setError("عنوان فیلم نباید خالی باشد.");
      setActiveTab("details");
      return;
    }

    if (!resolvedSlug) {
      setError("slug باید مشخص باشد.");
      setActiveTab("details");
      return;
    }

    if (!form.hls_url.trim()) {
      setError("مسیر HLS اجباری است.");
      setActiveTab("media");
      return;
    }

    if (!form.age_rating.trim()) {
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
      movieFormBodyFingerprint(form) === movieFormBodyFingerprintRef.current
    ) {
      await savePublishStatusOnly();
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    let targetMovieId = movie?.id;

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
        setMovie(createResponse.data.movie);
      }

      if (!targetMovieId) {
        setError("شناسه فیلم برای ذخیره‌سازی پیدا نشد.");
        return;
      }

      setSubmitStep("ذخیره فرم انتشار...");
      console.time("movie:publication-form");
      const saveResponse = await adminMoviesService.updatePublicationFormWithFiles(
        targetMovieId,
        buildPublicationFormData()
      );
      console.timeEnd("movie:publication-form");

      if (!(saveResponse.success && saveResponse.data)) {
        const firstError = saveResponse.errors
          ? Object.values(saveResponse.errors)[0]?.[0]
          : undefined;
        setError(firstError || saveResponse.message || "ذخیره فرم انجام نشد.");
        return;
      }

      let savedMovie = saveResponse.data.movie;
      setMovie(savedMovie);

      const processedPoster =
        savedMovie.poster_image?.original?.startsWith("/images/")
          ? savedMovie.poster_image.original
          : savedMovie.poster_url?.startsWith("/images/")
            ? savedMovie.poster_url
            : null;
      const processedBackdrop =
        savedMovie.backdrop_image?.original?.startsWith("/images/")
          ? savedMovie.backdrop_image.original
          : savedMovie.backdrop_url?.startsWith("/images/")
            ? savedMovie.backdrop_url.split("?")[0]
            : null;

      if (processedPoster || processedBackdrop) {
        setForm((current) => ({
          ...current,
          ...(processedPoster ? { poster_url: processedPoster } : {}),
          ...(processedBackdrop ? { backdrop_url: processedBackdrop } : {}),
        }));
      }

      const openedPipeline =
        saveResponse.pipeline_status === "pending" ||
        saveResponse.pipeline_status === "running";

      if (openedPipeline) {
        await Promise.all([
          revalidateAdminMoviesList(),
          revalidatePublicMoviePages(savedMovie.slug, movie?.slug, form.slug),
        ]);
        router.push("/admin/content-management/movies");
        router.refresh();
        return;
      }

      const needsBackgroundHlsVerify =
        savedMovie.processing_status === "queued" &&
        publishStatus === "published" &&
        !openedPipeline;

      const applyPublishOutcome = (updatedMovie: AdminMovie) => {
        setMovie(updatedMovie);
        setPublishStatus(updatedMovie.publish_status);
        setScheduledFor(apiDateTimeToInputValue(updatedMovie.scheduled_for));
        movieFormBodyFingerprintRef.current = movieFormBodyFingerprint(form);
        setSuccessMessage("");
        setPublishOutcomeStatus(updatedMovie.publish_status);
        setPublishOutcomeOpen(true);
        setActiveTab("publish");
        pendingNavigationRef.current = "/admin/content-management/movies";
        void Promise.all([
          revalidateAdminMoviesList(),
          revalidatePublicMoviePages(updatedMovie.slug, movie?.slug, form.slug),
        ]);
      };

      const runPublishStatusUpdate = async (movieId: number) => {
        console.time("movie:publish-status");
        const publishResponse = await adminMoviesService.updatePublishStatus(movieId, {
          publish_status: publishStatus,
          scheduled_for: publishStatus === "scheduled" ? scheduledFor : null,
        });
        console.timeEnd("movie:publish-status");

        if (publishResponse.success && publishResponse.data) {
          applyPublishOutcome(publishResponse.data.movie);
        } else {
          setError(publishResponse.message || "به‌روزرسانی وضعیت انتشار انجام نشد.");
          setActiveTab("publish");
        }
      };

      if (!needsBackgroundHlsVerify) {
        setSubmitStep("به‌روزرسانی وضعیت انتشار...");
        await runPublishStatusUpdate(savedMovie.id);
        return;
      }

      pendingNavigationRef.current = "/admin/content-management/movies";

      setSubmitting(false);
      setSubmitStep(null);
      setHlsSyncMessage("در حال اعتبارسنجی stream HLS…");

      void (async () => {
        console.time("movie:hls-poll");
        const settledMovie = await adminMoviesService.pollUntilProcessingSettles(savedMovie.id, {
          intervalMs: 800,
          maxWait: 15_000,
        });
        console.timeEnd("movie:hls-poll");

        setHlsSyncMessage("");

        if (!settledMovie) {
          setError("اعتبارسنجی HLS بیش از حد طول کشید. بعداً دوباره تلاش کن.");
          return;
        }

        setMovie(settledMovie);

        if (settledMovie.processing_status === "failed") {
          setError(
            settledMovie.processing_error ||
              "اعتبارسنجی HLS ناموفق بود. مسیر master.m3u8 را بررسی کن.",
          );
          setActiveTab("media");
          return;
        }

        if (settledMovie.processing_status === "ready") {
          await runPublishStatusUpdate(settledMovie.id);
        }
      })();
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
    form.hls_url || movie?.metadata?.playback?.hls_url || movie?.media_asset?.master_playlist_url || "";
  const isTmdbLoading = searchingTmdb || fetchingTmdb || ingestingTmdbImages;
  const previewPosterImage = movie?.poster_image ?? null;
  const previewBackdropImage = movie?.backdrop_image ?? null;
  const previewPosterUrl =
    pickAdminPreviewImageSrc(
      previewPosterImage,
      form.poster_url,
      movie?.metadata?.tmdb?.poster_url,
      movie?.poster_url,
      movie?.metadata?.tmdb?.poster_source_url,
    ) ?? "";
  const previewBackdropUrl =
    pickAdminPreviewImageSrc(
      previewBackdropImage,
      form.backdrop_url,
      movie?.metadata?.tmdb?.backdrop_url,
      movie?.metadata?.tmdb?.backdrop_source_url,
    ) ?? "";
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
                <div className="rounded-[28px] border border-[#38bdf8]/20 bg-[#38bdf8]/[0.06] p-5">
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

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">نام</span>
                    <input
                      value={form.title}
                      onChange={(event) => handleChange("title", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">نام اصلی</span>
                    <input
                      value={form.original_title}
                      onChange={(event) => handleChange("original_title", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">slug</span>
                    <input
                      value={form.slug}
                      onChange={(event) => handleChange("slug", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">سال</span>
                    <input
                      value={form.release_year}
                      onChange={(event) => handleChange("release_year", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>

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
                    <input
                      value={form.original_language}
                      onChange={(event) => handleChange("original_language", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">مدت زمان (دقیقه)</span>
                    <input
                      inputMode="numeric"
                      value={form.runtime_minutes}
                      onChange={(event) => handleChange("runtime_minutes", event.target.value)}
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

                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">خلاصه داستان</span>
                  <textarea
                    rows={6}
                    value={form.synopsis}
                    onChange={(event) => handleChange("synopsis", event.target.value)}
                    className="w-full rounded-[26px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-8 text-white outline-none transition focus:border-[#f5c518]/45"
                  />
                  {form.synopsis_en.trim() ? (
                    <p className="mt-2 text-xs leading-6 text-[#8ea4b3]">
                      متن انگلیسی TMDB: {form.synopsis_en}
                    </p>
                  ) : null}
                </label>

                <div className="grid gap-4 lg:grid-cols-2">
                  {(Object.keys(arrayFieldLabels) as MovieEditorArrayField[]).map((field) => (
                    <div
                      key={field}
                      className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-xs text-[#8ea4b3]">{arrayFieldLabels[field]}</p>

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
                          placeholder={
                            field === "genres"
                              ? "فارسی، مثلاً: درام، ماجراجویی"
                              : "آیتم جدید"
                          }
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
                    </div>
                  ))}
                </div>

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

                  {sortedActorsWithIndex.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {sortedActorsWithIndex.map(
                        ({ actor, index: actorIndex }, displayIndex) => (
                        <div
                          key={`${actor.name || "actor"}-${actorIndex}-${displayIndex}`}
                          className="group relative space-y-3 rounded-[20px] border border-white/10 bg-[#071019] p-3"
                        >
                          <p className="text-[11px] font-semibold text-[#8ea4b3]">
                            #{typeof actor.order === "number" ? actor.order + 1 : displayIndex + 1}
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
                                dir="ltr"
                                value={actor.name || ""}
                                onChange={(event) =>
                                  handleActorChange(actorIndex, "name", event.target.value)
                                }
                                placeholder="English name · e.g. Bradley Cooper"
                                className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none transition focus:border-[#f5c518]/45 ${ltrInputClass}`}
                              />
                              {actor.name && !isLatinPersonName(actor.name) ? (
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

                          <button
                            type="button"
                            onClick={() => removeActorRow(actorIndex)}
                            className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#fb7185]/30 bg-[#0b1720] text-[#fecdd3] opacity-0 transition group-hover:opacity-100"
                          >
                            <HiOutlineX className="h-3 w-3" />
                          </button>
                        </div>
                      ),
                      )}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-white/12 bg-[#071019] px-4 py-5 text-sm text-[#8ea4b3]">
                      هنوز بازیگری ثبت نشده است.
                    </div>
                  )}
                </div>

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
                    disabled={!canProceedToNextTab}
                    className="rounded-2xl border border-[#f5c518]/40 bg-[#f5c518] px-7 py-3 text-sm font-bold text-[#081018] transition hover:bg-[#e8bb0d] disabled:cursor-not-allowed disabled:opacity-60"
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
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                      <HiOutlinePhotograph className="h-4 w-4" />
                      پوستر
                    </span>
                    <input
                      type="url"
                      dir="ltr"
                      value={form.poster_url}
                      onChange={(event) => handleChange("poster_url", event.target.value)}
                      className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                      <HiOutlinePhotograph className="h-4 w-4" />
                      بنر
                    </span>
                    <input
                      type="url"
                      dir="ltr"
                      value={form.backdrop_url}
                      onChange={(event) => handleChange("backdrop_url", event.target.value)}
                      className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                    <HiOutlineVideoCamera className="h-4 w-4" />
                    لینک تریلر یوتیوب
                  </span>
                  <input
                    type="url"
                    dir="ltr"
                    value={form.trailer_url}
                    onChange={(event) => handleChange("trailer_url", event.target.value)}
                    className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                  />
                </label>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm text-[#8ea4b3]">مسیر HLS</span>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={form.hls_url}
                        onChange={(event) => handleChange("hls_url", event.target.value)}
                        placeholder="پوشهٔ پکیج یا آدرس کامل master.m3u8"
                        className={`w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                      />
                      {hlsSyncMessage ? (
                        <p className="mt-2 text-xs text-[#86efac]">{hlsSyncMessage}</p>
                      ) : null}
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm text-[#8ea4b3]">
                        لینک زیرنویس
                      </span>
                      <input
                        type="url"
                        dir="ltr"
                        value={form.subtitle_source_path}
                        onChange={(event) =>
                          handleChange("subtitle_source_path", event.target.value)
                        }
                        placeholder="https://cdn.example.com/subtitles/movie-fa.vtt"
                        className={`w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                        <HiOutlineVolumeUp className="h-4 w-4" />
                        لینک پلی‌لیست صوتی دوبله (از پکیج HLS)
                      </span>
                      <input
                        type="url"
                        dir="ltr"
                        value={form.dubbed_audio_url}
                        onChange={(event) =>
                          handleChange("dubbed_audio_url", event.target.value)
                        }
                        placeholder="معمولاً audio/fa/index.m3u8 — با ست شدن HLS پر می‌شود"
                        className={`w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
                      />
                    </label>
                  </div>

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
                      {form.download_links.map((link, index) => (
                        <div
                          key={link.id}
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
                    disabled={!canProceedToNextTab}
                    className="rounded-2xl border border-[#f5c518]/40 bg-[#f5c518] px-7 py-3 text-sm font-bold text-[#081018] transition hover:bg-[#e8bb0d] disabled:cursor-not-allowed disabled:opacity-60"
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

                <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">وضعیت انتشار</span>
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
                  hasSubtitle={Boolean(form.subtitle_source_path.trim())}
                  hasDubbed={
                    Boolean(form.dubbed_audio_url.trim()) ||
                    form.tags.some((tag) => /dub|دوبله/i.test(tag))
                  }
                />

                <EditorPublishSubmitBar
                  onSubmit={() => void handleSubmit()}
                  disabled={!canSubmitForm}
                  loading={submitting}
                  label={submitting ? submitStep || "در حال ثبت..." : "ثبت نهایی"}
                  hint={
                    submitting && submitStep
                      ? submitStep
                      : mode === "edit" &&
                          movieFormBodyFingerprint(form) === movieFormBodyFingerprintRef.current
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
                ) : previewBackdropUrl || previewPosterUrl ? (
                  <div className="relative h-[26rem] overflow-hidden">
                    {previewBackdropUrl || previewBackdropImage ? (
                      <div className="absolute inset-0">
                        <BackdropImage
                          title={form.title || "Movie"}
                          image={previewBackdropImage}
                          src={previewBackdropUrl}
                          usage="detail-backdrop"
                        />
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,25,0.08),rgba(7,16,25,0.88)_62%,rgba(7,16,25,0.98))]" />
                    <div className="relative flex h-full flex-col justify-end p-5">
                      <div className="flex items-end gap-4">
                        <div className="h-40 w-28 overflow-hidden rounded-[22px] border border-white/10 bg-[#071019] shadow-[0_20px_40px_rgba(0,0,0,0.32)]">
                          {previewPosterUrl || previewPosterImage ? (
                            <PosterImage
                              title={form.title || "Movie"}
                              image={previewPosterImage}
                              src={previewPosterUrl}
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
                    {playbackUrl || "هنوز مسیر HLS ثبت نشده"}
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



