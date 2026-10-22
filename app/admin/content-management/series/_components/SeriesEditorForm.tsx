"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineCollection,
  HiOutlineFilm,
  HiOutlineGlobeAlt,
  HiOutlinePhotograph,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineSave,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineX,
} from "react-icons/hi";
import AdminScheduleDateTimePicker from "../../../../components/admin/AdminScheduleDateTimePicker";
import AdminSelect from "../../../../components/admin/AdminSelect";
import EditorPublishSubmitBar from "../../../../components/admin/EditorPublishSubmitBar";
import AdminImageUrlField from "../../_components/AdminImageUrlField";
import PlaybackSubtitleDubFields from "../../_components/PlaybackSubtitleDubFields";
import FormFieldAnchor from "../../_components/FormFieldAnchor";
import {
  issuesToErrorMap,
  scrollToFormField,
  formFieldBorderClass,
} from "../../_lib/admin-form-tab-validation";
import {
  parseSeriesEpisodeFieldKey,
  parseSeriesSeasonFieldKey,
  validateSeriesCatalogTab,
  validateSeriesIdentityTab,
  validateSeriesSeasonsTab,
  validateSeriesTab,
} from "../../_lib/series-tab-validation";
import {
  resolveContentEntryMode,
  type ContentEntryMode,
} from "../../_lib/content-entry-mode";
import ContentEntryModeToggle from "../../_components/ContentEntryModeToggle";
import PublishOutcomeModal, {
  type PublishOutcomeStatus,
} from "../../../../components/admin/PublishOutcomeModal";
import TmdbPreviewSkeleton from "../../../../components/admin/TmdbPreviewSkeleton";
import TmdbTitleSearch from "../../../../components/admin/TmdbTitleSearch";
import SeoFieldsPanel from "../../../../components/admin/SeoFieldsPanel";
import {
  ContentWarningsField,
  ExternalIdsSection,
} from "../../../../components/admin/ContentMetadataFormFields";
import { BackdropImage, PersonProfileImage, PosterImage } from "../../../../components/images";
import SeriesFormStatusPanel from "../../../../components/admin/SeriesFormStatusPanel";
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
  adminMoviesService,
  unwrapCheckHlsExistsItems,
  unwrapHlsPackagePreview,
} from "../../../../lib/admin-movies";
import {
  buildEpisodeHlsUrl,
  buildHlsExistsCheckGroups,
  buildSeasonHlsBase,
  alignSeasonHlsBasesToConfirmedEpisodes,
  buildEmptyEpisodeHlsDiscoveryGroups,
  applyDiscoveredEpisodeHlsToForm,
  comparableHlsPlaylistUrl,
  episodeKeepsExistingPlayback,
  inferSeriesHlsBaseFromEpisodeUrls,
  listUnconfirmedEpisodeHlsCandidates,
  deriveSeasonHlsBase,
  hlsExistsEpisodeKey,
  normalizeHlsBaseUrl,
  parseHlsPackagePath,
  resolveEpisodeHlsUrl,
  shouldCascadeReplaceBase,
  toMasterPlaylistUrl,
} from "../../../../lib/series-hls-paths";
import {
  applyIngestedPrimaryImages,
  applyIngestedSeasonImages,
  buildAdminPreviewImageSources,
  buildSeriesPrimaryIngestSource,
  buildSeriesSeasonIngestSource,
  buildSeriesTmdbImageIngestPayload,
  finalizeTmdbImageIngestMessage,
  mergeIngestedActorProfiles,
  needsPrimaryImageIngest,
  preserveIngestedPrimaryImages,
  withTmdbImageProcessingMessage,
  type IngestTmdbImagesResult,
} from "../../../../lib/admin-tmdb-image-ingest";
import { toManagedImagePublicPath } from "../../../../lib/cinema-image";
import { sortCastByOrder, sortCastRows } from "../../../../lib/cast-utils";
import {
  formatEpisodeHeading,
  resolveEpisodeTitle,
} from "../../../../lib/episode-title";
import {
  apiDateTimeToInputValue,
  formatGregorianDate,
  formatGregorianDateTime,
  toDateTimeInputValue,
} from "../../../../lib/date-format";
import {
  filterLatinPersonNameList,
  isAgeRatingSelected,
  isLatinPersonName,
  resolveLatinPersonName,
  sanitizeLatinPersonName,
} from "../../../../lib/person-name";
import {
  mergeSeasonEpisodeSynopsisFromTmdb,
  normalizeSeasonEpisodeSynopsis,
} from "../../../../lib/series-synopsis-helper";
import {
  translateProductionStatus,
  translatePublishStatus,
} from "../../../../lib/production-status";

const seriesCatalogVisibilityOptions = [
  { value: "catalog_search", label: "کاتالوگ و جستجو", description: "نمایش در لیست‌ها و نتایج جستجو" },
  { value: "catalog", label: "فقط کاتالوگ", description: "فقط در صفحات لیست سریال‌ها" },
  { value: "search", label: "فقط جستجو", description: "فقط در نتایج جستجو" },
  { value: "hidden", label: "مخفی", description: "فقط از طریق لینک مستقیم قابل دسترسی است" },
];

const downloadQualityOptions = [
  { value: "2160p", label: "2160p", description: "4K Ultra HD" },
  { value: "1440p", label: "1440p", description: "QHD" },
  { value: "1080p", label: "1080p", description: "Full HD" },
  { value: "720p", label: "720p", description: "HD" },
  { value: "480p", label: "480p", description: "SD" },
  { value: "360p", label: "360p", description: "Low quality" },
];

const ltrLinkInputClass = "text-left";

type EpisodeDownloadLinkRow = {
  id: string;
  quality: string;
  url: string;
};

function createEpisodeDownloadLinkRow(
  quality = "1080p",
  url = "",
  id = `download-${Math.random().toString(36).slice(2, 10)}`,
): EpisodeDownloadLinkRow {
  return { id, quality, url };
}

function episodeDownloadRowsFromMap(links: Record<string, string>): EpisodeDownloadLinkRow[] {
  const entries = Object.entries(links).filter(
    ([quality, url]) => quality.trim() !== "" || url.trim() !== "",
  );

  if (!entries.length) {
    return [createEpisodeDownloadLinkRow()];
  }

  return entries.map(([quality, url]) => createEpisodeDownloadLinkRow(quality, url));
}

function episodeDownloadMapFromRows(rows: EpisodeDownloadLinkRow[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((accumulator, row) => {
    const quality = row.quality.trim();
    const url = row.url.trim();

    if (!quality || !url) {
      return accumulator;
    }

    accumulator[quality] = url;

    return accumulator;
  }, {});
}
import { revalidateAdminSeriesList } from "../../../../lib/admin-series-revalidate";
import { revalidatePublicSeriesPages } from "../../../../lib/catalog/revalidate";
import {
  SERIES_AGE_RATING_VALUES,
  normalizeAgeRating,
  seriesAgeRatingOptions,
} from "../../../../lib/age-rating";
import {
  adminSeriesService,
  type AdminSeries,
  type AdminSeriesActor,
  type AdminSeriesEpisode,
  type AdminSeriesPayload,
  type AdminSeriesSeason,
  type SeriesPublishStatus,
} from "../../../../lib/admin-series";
import {
  SlugAvailabilityHint,
  useSlugAvailability,
} from "../../../../hooks/useSlugAvailability";
import {
  TmdbIdAvailabilityHint,
  useTmdbIdAvailability,
} from "../../../../hooks/useTmdbIdAvailability";
import {
  applyTmdbSeasonToForm,
  applyTmdbSeriesOverviewToForm,
  episodeSourceMethodForProtocol,
  finalizeTmdbSeriesSyncExclusions,
  inferSeriesPlaybackProtocol,
  initialTmdbSyncState,
  resolveSeasonNumbersForTmdbSync,
  fetchTmdbSeasonsWithConcurrency,
  resolveTmdbSeasonFetchErrorMessage,
  type EpisodeDraft,
  type SeasonDraft,
  type SeriesCrewFormRow,
  type SeriesFormState,
  type MergeSeasonFromTmdbOptions,
  type TmdbSyncState,
} from "../_lib/series-tmdb-sync";
import {
  buildEpisodeUpsertPayload,
  episodeDraftFingerprint,
  mergeSavedEpisodeIntoDraft,
  seedEpisodeSavedFingerprints,
} from "../_lib/series-episode-payload";
import ContentChangeHistoryPanel from "../../../../components/admin/ContentChangeHistoryPanel";

type Mode = "create" | "edit";
type SeriesEditorTab = "identity" | "catalog" | "seo" | "seasons" | "publish";

type SeriesArrayField =
  | "creators"
  | "directors"
  | "writers"
  | "genres"
  | "tags"
  | "languages"
  | "countries";

type EpisodeHlsSyncTarget = {
  seasonId: string;
  episodeId: string;
  hlsUrl: string;
};

function collectEpisodeHlsSyncTargets(
  form: SeriesFormState,
  options?: { seasonId?: string },
): EpisodeHlsSyncTarget[] {
  const targets: EpisodeHlsSyncTarget[] = [];

  for (const season of form.seasons) {
    if (options?.seasonId && season.id !== options.seasonId) {
      continue;
    }

    for (const episode of season.episodes) {
      if (episode.source_method && episode.source_method !== "hls") {
        continue;
      }

      const resolved = resolveEpisodeHlsUrl({
        seriesBase: form.hls_base_url,
        seasonBase: season.hls_base_url,
        episodeHls: episode.hls_url,
        seasonNumber: season.season_number,
        episodeNumber: episode.episode_number,
      });
      const hlsUrl = toMasterPlaylistUrl(episode.hls_url.trim() || resolved.hlsUrl.trim());

      if (!hlsUrl) {
        continue;
      }

      targets.push({
        seasonId: season.id,
        episodeId: episode.id,
        hlsUrl,
      });
    }
  }

  return targets;
}

async function discoverAndFillEmptyEpisodeHls(
  form: SeriesFormState,
): Promise<{ nextForm: SeriesFormState; filled: EpisodeHlsSyncTarget[] }> {
  const groups = buildEmptyEpisodeHlsDiscoveryGroups(form);

  if (groups.length === 0) {
    return { nextForm: form, filled: [] };
  }

  const discoveries: EpisodeHlsSyncTarget[] = [];

  await Promise.all(
    groups.map(async (group) => {
      const response = await adminMoviesService.checkHlsExists(
        group.baseUrl,
        group.episodes,
      );
      const items = unwrapCheckHlsExistsItems(response);

      for (const item of items) {
        if (!item.exists) {
          continue;
        }

        const resolvedUrl = item.hls_url?.trim();

        if (!resolvedUrl) {
          continue;
        }

        const target = group.targetByKey.get(
          hlsExistsEpisodeKey(item.season, item.episode),
        );

        if (!target) {
          continue;
        }

        discoveries.push({
          seasonId: target.seasonId,
          episodeId: target.episodeId,
          hlsUrl: toMasterPlaylistUrl(resolvedUrl),
        });
      }
    }),
  );

  return applyDiscoveredEpisodeHlsToForm(form, discoveries);
}

type EpisodeHlsSyncMessageTone = "success" | "warning" | "error";

function episodeHlsSyncMessageTone(message: string): EpisodeHlsSyncMessageTone {
  if (message.includes("آماده نیست") || message.includes("مسیر اشتباه")) {
    return "warning";
  }

  if (message.includes("همگام شد") || message.includes("ثبت شد")) {
    return "success";
  }

  return "error";
}

function episodeHlsSyncMessageClassName(tone: EpisodeHlsSyncMessageTone): string {
  switch (tone) {
    case "warning":
      return "font-medium text-[#f8d977]";
    case "success":
      return "text-[#86efac]";
    default:
      return "text-[#fca5a5]";
  }
}

const HLS_NOT_READY_MESSAGE =
  "پکیج HLS هنوز روی سرور آماده نیست. این قسمت در سایت نمایش داده نمی‌شود؛ نیازی به حذف آن نیست.";

function episodeWithoutUnconfirmedHlsLink<
  T extends {
    source_method: "upload" | "embed" | "url" | "hls";
    video_url: string;
    hls_url: string;
    hls_verified: boolean;
  },
>(episode: T): T {
  if (episode.hls_verified && episode.hls_url.trim()) {
    return episode;
  }

  if (episode.source_method === "embed") {
    return {
      ...episode,
      hls_url: "",
      hls_verified: false,
    };
  }

  return {
    ...episode,
    hls_url: "",
    hls_verified: false,
    source_method: episode.video_url.trim()
      ? episode.source_method === "hls"
        ? "url"
        : episode.source_method
      : "url",
  };
}

const HLS_NOT_READY_DETAILED_MESSAGE =
  "پکیج HLS هنوز روی سرور آماده نیست یا مسیر اشتباه است. این قسمت در سایت نمایش داده نمی‌شود؛ نیازی به حذف آن نیست.";

const HLS_PREVIEW_CONCURRENCY = 8;

function EpisodeHlsSyncStatus({
  message,
  checking,
}: {
  message?: string;
  checking?: boolean;
}) {
  if (checking) {
    return (
      <p className="mt-1 flex items-center gap-2 text-xs font-medium text-[#f8d977]">
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[#f8d977]/25 border-t-[#f8d977]"
          aria-hidden
        />
        <span>در حال شناسایی پکیج HLS…</span>
      </p>
    );
  }

  if (!message) {
    return null;
  }

  const tone = episodeHlsSyncMessageTone(message);

  return (
    <p className={`mt-1 text-xs ${episodeHlsSyncMessageClassName(tone)}`}>{message}</p>
  );
}

const tabs: Array<{ key: SeriesEditorTab; label: string; icon: React.ReactNode }> = [
  { key: "identity", label: "اطلاعات سریال", icon: <HiOutlineFilm className="h-5 w-5" /> },
  { key: "catalog", label: "تصاویر", icon: <HiOutlinePhotograph className="h-5 w-5" /> },
  { key: "seo", label: "سئو", icon: <HiOutlineGlobeAlt className="h-5 w-5" /> },
  { key: "seasons", label: "فصل ها و قسمت ها", icon: <HiOutlineCollection className="h-5 w-5" /> },
  { key: "publish", label: "انتشار", icon: <HiOutlineCheckCircle className="h-5 w-5" /> },
];

const publishStatusOptions = [
  { value: "draft", label: "پیش نویس", description: "در سایت عمومی نمایش داده نمی شود" },
  { value: "scheduled", label: "زمان بندی شده", description: "برای انتشار آینده آماده می شود" },
  { value: "published", label: "منتشر شده", description: "در لیست عمومی قابل استفاده است" },
];

function seriesFormBodyFingerprint(form: SeriesFormState): string {
  const { publish_status: _publishStatus, scheduled_for: _scheduledFor, ...body } = form;

  return JSON.stringify(body);
}

const ageRatingValues = SERIES_AGE_RATING_VALUES;

const ageRatingOptions = seriesAgeRatingOptions(true);

const defaultStatusOptions = [
  { value: "", label: "وضعیت نامشخص" },
  { value: "Returning Series", label: "Returning Series - در حال پخش" },
  { value: "Ended", label: "Ended - پایان یافته" },
  { value: "Canceled", label: "Canceled - لغو شده" },
  { value: "In Production", label: "In Production - در حال تولید" },
  { value: "Pilot", label: "Pilot - پایلوت" },
];

const ltrInputClass = "text-left";
const tabOrder: SeriesEditorTab[] = ["identity", "catalog", "seo", "seasons", "publish"];

type SeriesFreeArrayField = Extract<
  SeriesArrayField,
  "creators" | "directors" | "writers" | "tags"
>;

const freeArrayFieldLabels: Record<SeriesFreeArrayField, string> = {
  creators: "سازندگان",
  directors: "کارگردان ها",
  writers: "نویسنده‌ها (اختیاری)",
  tags: "برچسب ها",
};

function alignSeriesFormTaxonomy(
  form: SeriesFormState,
  genres: AdminTaxonomyGenre[],
  countries: AdminTaxonomyCountry[],
  languages: AdminTaxonomyLanguage[],
): SeriesFormState {
  return {
    ...form,
    genres: normalizeGenreValuesToCatalog(
      form.genres,
      toGenreSelectOptions(genres),
    ),
    countries: normalizeCountryValuesToIso(form.countries, countries),
    languages: normalizeLanguageValuesToIso(form.languages, languages),
    original_language: normalizeOriginalLanguageToIso(
      form.original_language,
      languages,
    ),
  };
}

function uniqueId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTmdbCodeInput(value: string) {
  const match = value.match(/\d+/);

  return match?.[0] ?? "";
}

function buildSlug(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const slug = slugify(candidate || "");

    if (slug) {
      return slug;
    }
  }

  return "";
}

function createEpisodeDraft(
  episodeNumber = 1,
  protocol: "hls" | "mp4" = "hls",
): EpisodeDraft {
  return {
    id: uniqueId("episode"),
    episode_number: String(episodeNumber),
    title: "",
    synopsis: "",
    synopsis_en: "",
    air_date: "",
    duration_minutes: "",
    still_url: "",
    source_method: episodeSourceMethodForProtocol(protocol),
    video_url: "",
    embed_url: "",
    hls_url: "",
    hls_verified: false,
    dash_url: "",
    dash_verified: false,
    download_links: {},
    subtitle_url: "",
    dubbed_audio_url: "",
    has_subtitle: false,
    has_dubbed: false,
    publish_status: "draft",
  };
}

function createSeasonDraft(
  seasonNumber = 1,
  protocol: "hls" | "mp4" = "hls",
): SeasonDraft {
  return {
    id: uniqueId("season"),
    season_number: String(seasonNumber),
    name: `فصل ${seasonNumber}`,
    synopsis: "",
    synopsis_en: "",
    air_date: "",
    episode_count: "",
    poster_url: "",
    hls_base_url: "",
    episodes: [createEpisodeDraft(1, protocol)],
  };
}

function getNextSeasonNumber(seasons: SeasonDraft[]) {
  const maxSeason = seasons.reduce(
    (max, season) => Math.max(max, Number(season.season_number) || 0),
    0,
  );

  return maxSeason + 1;
}

function getNextEpisodeNumber(episodes: EpisodeDraft[]) {
  const maxEpisode = episodes.reduce(
    (max, episode) => Math.max(max, Number(episode.episode_number) || 0),
    0,
  );

  return maxEpisode + 1;
}

function buildHlsSyncFingerprint(form: SeriesFormState): string {
  const parts: string[] = [normalizeHlsBaseUrl(form.hls_base_url).toLowerCase()];

  for (const season of form.seasons) {
    const seasonBase =
      normalizeHlsBaseUrl(season.hls_base_url) ||
      deriveSeasonHlsBase(form.hls_base_url, season.season_number);
    parts.push(`s:${season.season_number}:${seasonBase.toLowerCase()}`);

    for (const episode of season.episodes) {
      if (episode.source_method && episode.source_method !== "hls") {
        parts.push(`e:${season.id}:${episode.id}:`);
        continue;
      }

      const resolved = resolveEpisodeHlsUrl({
        seriesBase: form.hls_base_url,
        seasonBase: season.hls_base_url,
        episodeHls: episode.hls_url,
        seasonNumber: season.season_number,
        episodeNumber: episode.episode_number,
      });
      const hlsUrl = toMasterPlaylistUrl(
        episode.hls_url.trim() || resolved.hlsUrl.trim(),
      );
      parts.push(
        `e:${season.id}:${episode.id}:${comparableHlsPlaylistUrl(hlsUrl || "")}`,
      );
    }
  }

  return parts.join("|");
}

function collectEpisodeHlsSyncTargetsForComparableChange(
  form: SeriesFormState,
  previousComparables: Map<string, string>,
): EpisodeHlsSyncTarget[] {
  const targets: EpisodeHlsSyncTarget[] = [];

  for (const season of form.seasons) {
    for (const episode of season.episodes) {
      if (episode.source_method && episode.source_method !== "hls") {
        continue;
      }

      const resolved = resolveEpisodeHlsUrl({
        seriesBase: form.hls_base_url,
        seasonBase: season.hls_base_url,
        episodeHls: episode.hls_url,
        seasonNumber: season.season_number,
        episodeNumber: episode.episode_number,
      });
      const hlsUrl = toMasterPlaylistUrl(
        episode.hls_url.trim() || resolved.hlsUrl.trim(),
      );
      const comparable = comparableHlsPlaylistUrl(hlsUrl || "");
      const key = `${season.id}:${episode.id}`;

      if (!comparable || previousComparables.get(key) === comparable) {
        continue;
      }

      targets.push({
        seasonId: season.id,
        episodeId: episode.id,
        hlsUrl,
      });
    }
  }

  return targets;
}

function resolveEpisodeComparableHlsUrl(
  form: SeriesFormState,
  season: SeasonDraft,
  episode: EpisodeDraft,
): string {
  if (episode.source_method && episode.source_method !== "hls") {
    return "";
  }

  const resolved = resolveEpisodeHlsUrl({
    seriesBase: form.hls_base_url,
    seasonBase: season.hls_base_url,
    episodeHls: episode.hls_url,
    seasonNumber: season.season_number,
    episodeNumber: episode.episode_number,
  });
  const hlsUrl = toMasterPlaylistUrl(
    episode.hls_url.trim() || resolved.hlsUrl.trim(),
  );

  return comparableHlsPlaylistUrl(hlsUrl || "");
}

function buildEpisodeHlsComparableMap(form: SeriesFormState): Map<string, string> {
  const map = new Map<string, string>();

  for (const season of form.seasons) {
    for (const episode of season.episodes) {
      map.set(`${season.id}:${episode.id}`, resolveEpisodeComparableHlsUrl(form, season, episode));
    }
  }

  return map;
}

function filterEpisodeHlsSyncTargetsForInitialScan(
  form: SeriesFormState,
  targets: EpisodeHlsSyncTarget[],
): EpisodeHlsSyncTarget[] {
  return targets.filter((target) => {
    const season = form.seasons.find((row) => row.id === target.seasonId);
    const episode = season?.episodes.find((row) => row.id === target.episodeId);

    if (!episode) {
      return true;
    }

    return !(episode.hls_verified && episode.hls_url.trim());
  });
}

function seedVerifiedEpisodeHlsSyncState(form: SeriesFormState): {
  cache: Record<string, string>;
  comparables: Map<string, string>;
  messages: Record<string, string>;
} {
  const cache: Record<string, string> = {};
  const comparables = buildEpisodeHlsComparableMap(form);
  const messages: Record<string, string> = {};

  for (const season of form.seasons) {
    for (const episode of season.episodes) {
      if (!episode.hls_verified) {
        continue;
      }

      const comparable = comparables.get(`${season.id}:${episode.id}`) || "";

      if (!comparable) {
        continue;
      }

      const syncKey = `${season.id}:${episode.id}`;
      cache[syncKey] = comparable;

      if (
        episode.subtitle_url.trim() ||
        episode.dubbed_audio_url.trim() ||
        episode.has_subtitle ||
        episode.has_dubbed
      ) {
        messages[syncKey] = "زیرنویس و دوبله از پکیج HLS همگام شد.";
      } else if (Object.keys(episode.download_links || {}).length > 0) {
        messages[syncKey] = "مسیر HLS و لینک‌های دانلود همگام شد.";
      } else {
        messages[syncKey] = "مسیر HLS ثبت شد؛ زیرنویس یا دوبله در پکیج یافت نشد.";
      }
    }
  }

  return { cache, comparables, messages };
}

function createInitialFormState(): SeriesFormState {
  return {
    title: "",
    slug: "",
    original_title: "",
    synopsis: "",
    synopsis_en: "",
    first_air_date: "",
    last_air_date: "",
    release_year: "",
    status: "Returning Series",
    episode_runtime_minutes: "",
    number_of_seasons: "",
    number_of_episodes: "",
    network: "",
    provider_name: "",
    poster_url: "",
    poster_source_url: "",
    backdrop_url: "",
    backdrop_source_url: "",
    trailer_url: "",
    homepage_url: "",
    age_rating: "",
    is_featured: false,
    catalog_visibility: "catalog_search",
    publish_status: "draft",
    scheduled_for: "",
    tmdb_query: "",
    tmdb_id: "",
    imdb_id: "",
    tvdb_id: "",
    meta_title: "",
    meta_description: "",
    content_warnings: [],
    rating: "",
    popularity: "",
    vote_count: "",
    original_language: "",
    creators: [],
    directors: [],
    writers: [],
    genres: [],
    tags: [],
    languages: [],
    countries: [],
    actors: [],
    crew: [],
    playback_protocol: "hls",
    hls_base_url: "",
    drm_scheme: "none",
    drm_license_url: "",
    seasons: [createSeasonDraft(1, "hls")],
    tmdb_excluded_season_numbers: [],
    tmdb_excluded_episodes: [],
    admin_notes: "",
  };
}

function parseTagInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeActor(actor: AdminSeriesActor): AdminSeriesActor | null {
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
    profile_image: actor.profile_image ?? null,
    tmdb_person_id: actor.tmdb_person_id ?? null,
    credit_id: actor.credit_id?.trim() || null,
    order: typeof actor.order === "number" ? actor.order : null,
    known_for_department: actor.known_for_department?.trim() || null,
    episode_count: typeof actor.episode_count === "number" ? actor.episode_count : null,
  };
}

function normalizeActors(actors: AdminSeriesActor[]) {
  return sortCastByOrder(
    actors
      .map((actor) => normalizeActor(actor))
      .filter((actor): actor is AdminSeriesActor => actor !== null),
  );
}

function getSubmitButtonLabel(submitting: boolean) {
  return submitting ? "در حال ثبت..." : "ثبت";
}

function extractActorNames(actors: AdminSeriesActor[]) {
  return normalizeActors(actors)
    .map((actor) => actor.name?.trim() || "")
    .filter((name): name is string => Boolean(name));
}

function nullableNumber(value: string) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function nullableDurationMinutes(value: string) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function nullableString(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
}

function mapSeriesToForm(series: AdminSeries): SeriesFormState {
  const synopsisFields = normalizeSeasonEpisodeSynopsis(
    series.synopsis,
    series.metadata?.tmdb?.synopsis_en,
  );

  const mapped: SeriesFormState = {
    title: series.title || "",
    slug: series.slug || "",
    original_title: series.original_title || "",
    synopsis: synopsisFields.synopsis,
    synopsis_en: synopsisFields.synopsis_en,
    first_air_date: series.first_air_date || "",
    last_air_date: series.last_air_date || "",
    release_year: series.release_year ? String(series.release_year) : "",
    status: series.status || "",
    episode_runtime_minutes:
      series.episode_runtime_minutes != null
        ? String(series.episode_runtime_minutes)
        : "",
    number_of_seasons: series.number_of_seasons ? String(series.number_of_seasons) : "",
    number_of_episodes: series.number_of_episodes
      ? String(series.number_of_episodes)
      : "",
    network: series.network || "",
    provider_name: series.provider_name || "",
    poster_url:
      toManagedImagePublicPath(series.poster_image?.original) ||
      toManagedImagePublicPath(series.poster_url) ||
      series.poster_url ||
      series.metadata?.tmdb?.poster_url ||
      "",
    poster_source_url:
      series.metadata?.tmdb?.poster_source_url ||
      (series.metadata?.tmdb?.poster_url?.startsWith("http")
        ? series.metadata.tmdb.poster_url
        : "") ||
      "",
    backdrop_url:
      toManagedImagePublicPath(series.backdrop_image?.original) ||
      toManagedImagePublicPath(series.backdrop_url) ||
      series.backdrop_url ||
      series.metadata?.tmdb?.backdrop_url ||
      "",
    backdrop_source_url:
      series.metadata?.tmdb?.backdrop_source_url ||
      (series.metadata?.tmdb?.backdrop_url?.startsWith("http")
        ? series.metadata.tmdb.backdrop_url
        : "") ||
      "",
    trailer_url: series.trailer_url || "",
    homepage_url: series.homepage_url || "",
    age_rating: normalizeAgeRating(series.age_rating) || "",
    is_featured: Boolean(series.is_featured),
    catalog_visibility: series.catalog_visibility || "catalog_search",
    publish_status: series.publish_status || "draft",
    scheduled_for: apiDateTimeToInputValue(series.scheduled_for),
    admin_notes: series.admin_notes || series.metadata?.admin_notes || "",
    tmdb_query: series.metadata?.tmdb?.query || "",
    tmdb_id: series.metadata?.tmdb?.tmdb_id ? String(series.metadata.tmdb.tmdb_id) : "",
    imdb_id: series.metadata?.tmdb?.imdb_id || "",
    tvdb_id: series.metadata?.tmdb?.tvdb_id || "",
    meta_title: series.metadata?.seo?.meta_title || "",
    meta_description: series.metadata?.seo?.meta_description || "",
    content_warnings: series.metadata?.content_warnings || [],
    rating:
      typeof series.metadata?.tmdb?.rating === "number"
        ? String(series.metadata.tmdb.rating)
        : "",
    popularity:
      typeof series.metadata?.tmdb?.popularity === "number"
        ? String(series.metadata.tmdb.popularity)
        : "",
    vote_count:
      typeof series.metadata?.tmdb?.vote_count === "number"
        ? String(series.metadata.tmdb.vote_count)
        : "",
    original_language: series.metadata?.tmdb?.original_language || "",
    creators: series.metadata?.tmdb?.creators || [],
    directors: series.metadata?.tmdb?.directors || [],
    writers: series.metadata?.tmdb?.writers || [],
    genres: series.metadata?.tmdb?.genres || [],
    tags: series.metadata?.tmdb?.tags || [],
    languages: series.metadata?.tmdb?.languages || [],
    countries: series.metadata?.tmdb?.countries || [],
    actors: (() => {
      const fromApi = series.cast?.length
        ? series.cast.map((c) => ({
            name: c.name || null,
            character: c.character || null,
            profile_url: c.profile_url || null,
            profile_image: c.profile_image ?? null,
            tmdb_person_id: c.tmdb_person_id ?? null,
            credit_id: c.credit_id || null,
            order: typeof c.order === "number" ? c.order : null,
            known_for_department: c.known_for_department || "Acting",
            episode_count: typeof c.episode_count === "number" ? c.episode_count : null,
          }))
        : null;
      return fromApi?.length ? normalizeActors(fromApi) : normalizeActors(series.metadata?.tmdb?.actors || []);
    })(),
    crew: (series.crew || []).map((c) => ({
      tmdb_person_id: c.tmdb_person_id ?? null,
      name: c.name || "",
      job: c.job || "",
      department: c.department || "",
      profile_url: c.profile_url || null,
      profile_image: c.profile_image ?? null,
      credit_id: c.credit_id || null,
    })),
    playback_protocol: "hls",
    hls_base_url: series.hls_base_url || "",
    drm_scheme: series.drm_scheme || "none",
    drm_license_url: series.drm_license_url || "",
    tmdb_excluded_season_numbers:
      series.metadata?.tmdb?.exclusions?.season_numbers?.map((value) => Number(value)) ??
      [],
    tmdb_excluded_episodes:
      series.metadata?.tmdb?.exclusions?.episodes?.map((row) => ({
        season_number: Number(row.season_number),
        episode_number: Number(row.episode_number),
      })) ?? [],
    seasons:
      series.seasons && series.seasons.length
        ? series.seasons.map((season) => {
            const seasonSynopsis = normalizeSeasonEpisodeSynopsis(
              season.synopsis,
              season.synopsis_en,
            );

            return {
            id: uniqueId("season"),
            season_number: String(season.season_number),
            name: season.name || `فصل ${season.season_number}`,
            synopsis: seasonSynopsis.synopsis,
            synopsis_en: seasonSynopsis.synopsis_en,
            air_date: season.air_date || "",
            episode_count: season.episode_count ? String(season.episode_count) : "",
            poster_url: season.poster_url || "",
            hls_base_url: season.hls_base_url || "",
            episodes: season.episodes.length
              ? season.episodes.map((episode) => {
                  const episodeSynopsis = normalizeSeasonEpisodeSynopsis(
                    episode.synopsis,
                    episode.synopsis_en,
                  );

                  return {
                  id: uniqueId("episode"),
                  episode_number: String(episode.episode_number),
                  title: resolveEpisodeTitle(
                    [episode.title],
                    episode.episode_number,
                  ),
                  synopsis: episodeSynopsis.synopsis,
                  synopsis_en: episodeSynopsis.synopsis_en,
                  air_date: episode.air_date || "",
                  duration_minutes:
                    episode.duration_minutes != null
                      ? String(episode.duration_minutes)
                      : "",
                  still_url: episode.still_url || "",
                  source_method: episode.source_method || "hls",
                  video_url: episode.video_url || "",
                  embed_url: episode.embed_url || "",
                  hls_url: episode.hls_url || "",
                  hls_verified: Boolean(episode.hls_verified),
                  dash_url: episode.dash_url || "",
                  dash_verified: Boolean(episode.dash_verified),
                  download_links: episode.download_links || {},
                  subtitle_url: episode.subtitle_url || "",
                  dubbed_audio_url: episode.dubbed_audio_url || "",
                  has_subtitle: Boolean(episode.has_subtitle),
                  has_dubbed: Boolean(episode.has_dubbed),
                  publish_status: episode.publish_status || "draft",
                };
              })
              : [createEpisodeDraft(1)],
            };
          })
        : [createSeasonDraft(1)],
  };

  mapped.seasons = alignSeasonHlsBasesToConfirmedEpisodes(
    mapped.seasons,
    normalizeHlsBaseUrl(mapped.hls_base_url),
  );
  mapped.playback_protocol = inferSeriesPlaybackProtocol(mapped.seasons);
  return mapped;
}

function formToPayload(
  form: SeriesFormState,
  taxonomyCountries: AdminTaxonomyCountry[] = [],
  entryMode: ContentEntryMode = "tmdb",
): AdminSeriesPayload {
  const seriesHlsBase = normalizeHlsBaseUrl(form.hls_base_url);

  const seasons: AdminSeriesSeason[] = form.seasons
    .filter((season): season is SeasonDraft => Boolean(season?.season_number?.trim()))
    .filter((season) => {
      if (entryMode !== "manual") {
        return true;
      }

      // در حالت دستی، فصل پیش‌فرض خالی را ذخیره نکن
      return season.episodes.some(
        (episode) =>
          Boolean(episode?.title?.trim()) ||
          Boolean(episode?.hls_url?.trim()) ||
          Boolean(episode?.video_url?.trim()) ||
          Boolean(episode?.embed_url?.trim()) ||
          Boolean(episode?.synopsis?.trim()) ||
          Boolean(episode?.still_url?.trim()),
      );
    })
    .map((season) => {
      const seasonNumber = Number(season.season_number);
      const seasonHasConfirmedHls = (season.episodes || []).some(
        (episode) => episode?.source_method === "hls" && Boolean(episode.hls_url.trim()),
      );
      const seasonHlsBase = seasonHasConfirmedHls
        ? normalizeHlsBaseUrl(season.hls_base_url) ||
          buildSeasonHlsBase(seriesHlsBase, seasonNumber)
        : "";
      const episodes: AdminSeriesEpisode[] = (season.episodes || [])
        .filter((episode): episode is EpisodeDraft =>
          Boolean(episode?.episode_number?.trim()),
        )
        .map((episode) => {
          return {
          season_number: seasonNumber,
          episode_number: Number(episode.episode_number),
          title: resolveEpisodeTitle(
            [episode.title],
            episode.episode_number,
          ),
          synopsis: nullableString(episode.synopsis) || null,
          synopsis_en: nullableString(episode.synopsis_en) || null,
          air_date: nullableString(episode.air_date) || null,
          duration_minutes: nullableDurationMinutes(episode.duration_minutes),
          still_url: nullableString(episode.still_url) || null,
          source_method: episode.source_method || "hls",
          video_url:
            episode.source_method === "url" || episode.source_method === "upload"
              ? nullableString(episode.video_url) || null
              : null,
          embed_url:
            episode.source_method === "embed"
              ? nullableString(episode.embed_url) || null
              : null,
          hls_url:
            episode.source_method === "hls"
              ? nullableString(episode.hls_url) || null
              : null,
          hls_verified: episode.source_method === "hls" ? Boolean(episode.hls_verified) : false,
          dash_url: episode.dash_verified ? nullableString(episode.dash_url) || null : null,
          dash_verified: Boolean(episode.dash_verified),
          download_links: (() => {
            const links = episodeDownloadMapFromRows(
              episodeDownloadRowsFromMap(episode.download_links || {}),
            );

            return Object.keys(links).length > 0 ? links : undefined;
          })(),
          subtitle_url: nullableString(episode.subtitle_url) || null,
          dubbed_audio_url: nullableString(episode.dubbed_audio_url) || null,
          has_subtitle: Boolean(episode.has_subtitle),
          has_dubbed: Boolean(episode.has_dubbed),
          publish_status: episode.publish_status || form.publish_status,
        };
        });

      return {
        season_number: seasonNumber,
        name: nullableString(season.name) || null,
        synopsis: nullableString(season.synopsis) || null,
        synopsis_en: nullableString(season.synopsis_en) || null,
        air_date: nullableString(season.air_date) || null,
        episode_count: nullableNumber(season.episode_count) || episodes.length || null,
        poster_url: nullableString(season.poster_url) || null,
        hls_base_url: nullableString(seasonHlsBase),
        episodes,
      };
    });

  return {
    title: form.title.trim(),
    slug: buildSlug(form.slug, form.original_title, form.title, form.tmdb_id ? `series-${form.tmdb_id}` : null),
    original_title: nullableString(form.original_title),
    synopsis: nullableString(form.synopsis),
    synopsis_en: nullableString(form.synopsis_en) || null,
    first_air_date: nullableString(form.first_air_date) || null,
    last_air_date: nullableString(form.last_air_date) || null,
    release_year: nullableNumber(form.release_year),
    status: nullableString(form.status),
    episode_runtime_minutes: nullableDurationMinutes(form.episode_runtime_minutes),
    number_of_seasons: nullableNumber(form.number_of_seasons),
    number_of_episodes: nullableNumber(form.number_of_episodes),
    network: nullableString(form.network),
    provider_name: nullableString(form.provider_name),
    poster_url: nullableString(form.poster_url),
    backdrop_url: nullableString(form.backdrop_url),
    poster_source_url: nullableString(form.poster_source_url),
    backdrop_source_url: nullableString(form.backdrop_source_url),
    trailer_url: nullableString(form.trailer_url),
    homepage_url: nullableString(form.homepage_url),
    hls_base_url: nullableString(seriesHlsBase),
    age_rating: nullableString(normalizeAgeRating(form.age_rating) || form.age_rating),
    catalog_visibility: form.catalog_visibility || "catalog_search",
    is_featured: form.is_featured,
    exclude_from_slider: !form.is_featured,
    drm_scheme: form.drm_scheme || "none",
    drm_license_url:
      form.drm_scheme !== "none" ? nullableString(form.drm_license_url) || null : null,
    publish_status: form.publish_status,
    scheduled_for: form.publish_status === "scheduled" ? form.scheduled_for || null : null,
    content_source: entryMode,
    tmdb_query: entryMode === "tmdb" ? nullableString(form.tmdb_query) || undefined : undefined,
    tmdb_id: entryMode === "tmdb" ? nullableNumber(form.tmdb_id) : null,
    imdb_id: nullableString(form.imdb_id),
    tvdb_id: nullableString(form.tvdb_id),
    meta_title: nullableString(form.meta_title),
    meta_description: nullableString(form.meta_description),
    content_warnings: form.content_warnings,
    rating: nullableNumber(form.rating),
    popularity: nullableNumber(form.popularity),
    vote_count: nullableNumber(form.vote_count),
    original_language: nullableString(form.original_language),
    creators: form.creators,
    directors: form.directors,
    writers: form.writers,
    genres: form.genres,
    tags: form.tags,
    languages: languageValuesForSave(form.languages),
    countries: countryLabelsForSave(form.countries, taxonomyCountries),
    actors: normalizeActors(form.actors),
    cast: normalizeActors(form.actors).map((a, idx) => ({
      tmdb_person_id: a.tmdb_person_id ?? null,
      name: a.name || "",
      character: a.character || "",
      profile_url: a.profile_url || null,
      profile_image: a.profile_image ?? null,
      credit_id: a.credit_id || null,
      order: a.order ?? idx,
      known_for_department: a.known_for_department || "Acting",
      episode_count: a.episode_count ?? undefined,
    })),
    crew: form.crew
      .filter((c) => c.name.trim())
      .map((c) => ({
        tmdb_person_id: c.tmdb_person_id,
        name: c.name.trim(),
        job: c.job,
        department: c.department,
        profile_url: c.profile_url,
        credit_id: c.credit_id || null,
      })),
    tmdb_excluded_season_numbers: form.tmdb_excluded_season_numbers,
    tmdb_excluded_episodes: form.tmdb_excluded_episodes,
    admin_notes: nullableString(form.admin_notes) || null,
    seasons,
  };
}

export default function SeriesEditorForm({
  mode,
  seriesId,
  createInstanceKey,
}: {
  mode: Mode;
  seriesId?: string;
  createInstanceKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SeriesEditorTab>(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");

      if (tab === "publish") {
        return "publish";
      }
    }

    return "identity";
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishOutcomeOpen, setPublishOutcomeOpen] = useState(false);
  const [publishOutcomeStatus, setPublishOutcomeStatus] =
    useState<PublishOutcomeStatus>("draft");
  const [form, setForm] = useState<SeriesFormState>(createInitialFormState);
  const [entryMode, setEntryMode] = useState<ContentEntryMode>("tmdb");
  const [series, setSeries] = useState<AdminSeries | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tabFieldErrors, setTabFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  const [fetchingTmdb, setFetchingTmdb] = useState(false);
  const [ingestingTmdbImages, setIngestingTmdbImages] = useState(false);
  const [tmdbSyncState, setTmdbSyncState] = useState<TmdbSyncState>(initialTmdbSyncState);
  const [lastFetchedTmdbCode, setLastFetchedTmdbCode] = useState("");
  const [statusOptions, setStatusOptions] = useState(defaultStatusOptions);
  const [taxonomyGenres, setTaxonomyGenres] = useState<AdminTaxonomyGenre[]>([]);
  const [taxonomyCountries, setTaxonomyCountries] = useState<AdminTaxonomyCountry[]>([]);
  const [taxonomyLanguages, setTaxonomyLanguages] = useState<AdminTaxonomyLanguage[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [homeHeroSlider, setHomeHeroSlider] = useState({
    max: 7,
    current: 0,
    remaining: 7,
  });
  const [listDrafts, setListDrafts] = useState<Record<SeriesFreeArrayField, string>>({
    creators: "",
    directors: "",
    writers: "",
    tags: "",
  });
  const [expandedSeasonIds, setExpandedSeasonIds] = useState<string[]>(() =>
    form.seasons[0]?.id ? [form.seasons[0].id] : [],
  );
  const [expandedEpisodeKeys, setExpandedEpisodeKeys] = useState<string[]>([]);
  const [episodeHlsSyncMessage, setEpisodeHlsSyncMessage] = useState<Record<string, string>>({});
  const [episodeHlsSyncPending, setEpisodeHlsSyncPending] = useState<Record<string, boolean>>({});
  const [seriesHlsSyncMessage, setSeriesHlsSyncMessage] = useState("");
  const [seriesHlsCascadePending, setSeriesHlsCascadePending] = useState(false);
  const [seasonHlsCascadePendingKeys, setSeasonHlsCascadePendingKeys] = useState<
    Record<string, boolean>
  >({});
  const [episodeHlsBatchScheduled, setEpisodeHlsBatchScheduled] = useState(false);
  const [episodeHlsPreviewActive, setEpisodeHlsPreviewActive] = useState(false);
  const [episodeSavingKeys, setEpisodeSavingKeys] = useState<Record<string, boolean>>({});
  const [episodeSaveFeedback, setEpisodeSaveFeedback] = useState<Record<string, string>>({});
  const [episodeSavedFingerprints, setEpisodeSavedFingerprints] = useState<
    Record<string, string>
  >({});
  const tmdbAbortControllerRef = useRef<AbortController | null>(null);
  const tmdbImageIngestAbortRef = useRef<AbortController | null>(null);
  const episodeHlsBatchDebounceTimerRef = useRef<number | null>(null);
  const episodeHlsBatchPreviousComparablesRef = useRef<Map<string, string> | null>(null);
  const episodeHlsSyncGenerationRef = useRef<Record<string, number>>({});
  const seriesHlsCascadeTimerRef = useRef<number | null>(null);
  const seasonHlsCascadeTimersRef = useRef<Record<string, number>>({});
  const lastCommittedSeriesHlsBaseRef = useRef("");
  const scheduleEpisodeHlsSyncAfterFormChangeRef = useRef<
    ((previousComparables: Map<string, string>, nextForm: SeriesFormState) => void) | null
  >(null);
  const scheduleEpisodeHlsSyncRef = useRef<
    ((seasonId: string, episodeId: string, hlsUrl: string) => void) | null
  >(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);
  const seriesFormBodyFingerprintRef = useRef("");
  const formRef = useRef(form);
  formRef.current = form;
  const lastHlsFingerprintRef = useRef("");
  const episodeHlsComparableMapRef = useRef<Map<string, string>>(new Map());
  const hlsAutoSyncBootstrappedRef = useRef(false);
  const lastSyncedEpisodeHlsRef = useRef<Record<string, string>>({});
  const episodeHlsPreviewQueueRef = useRef<Array<() => Promise<void>>>([]);
  const episodeHlsPreviewRunningRef = useRef(false);
  const pendingNavigationRef = useRef<string | null>(null);

  const hlsSyncFingerprint = useMemo(
    () => buildHlsSyncFingerprint(form),
    [form.hls_base_url, form.seasons],
  );

  const resetCreateEditorState = () => {
    const initialForm = createInitialFormState();

    setSeries(null);
    setForm(initialForm);
    setEntryMode("tmdb");
    setActiveTab("identity");
    setPublishOutcomeOpen(false);
    setPublishOutcomeStatus("draft");
    setSubmitting(false);
    setSubmitStep(null);
    setError("");
    setSuccessMessage("");
    setSearchMessage("");
    setSearchingTmdb(false);
    setFetchingTmdb(false);
    setIngestingTmdbImages(false);
    setTmdbSyncState(initialTmdbSyncState);
    setLastFetchedTmdbCode("");
    setListDrafts({
      creators: "",
      directors: "",
      writers: "",
      tags: "",
    });
    setExpandedSeasonIds(
      initialForm.seasons[0]?.id ? [initialForm.seasons[0].id] : [],
    );
    setExpandedEpisodeKeys([]);
    setEpisodeHlsSyncMessage({});
    setEpisodeHlsSyncPending({});
    setSeriesHlsSyncMessage("");
    setSeriesHlsCascadePending(false);
    setSeasonHlsCascadePendingKeys({});
    setEpisodeHlsBatchScheduled(false);
    setEpisodeHlsPreviewActive(false);
    setEpisodeSavingKeys({});
    setEpisodeSaveFeedback({});
    setEpisodeSavedFingerprints({});
    setPreviewLoading(false);
    tmdbAbortControllerRef.current = null;
    tmdbImageIngestAbortRef.current = null;
    episodeHlsBatchPreviousComparablesRef.current = null;
    episodeHlsSyncGenerationRef.current = {};
    lastCommittedSeriesHlsBaseRef.current = "";
    seriesFormBodyFingerprintRef.current = "";
    lastHlsFingerprintRef.current = "";
    episodeHlsComparableMapRef.current = new Map();
    hlsAutoSyncBootstrappedRef.current = false;
    lastSyncedEpisodeHlsRef.current = {};
    pendingNavigationRef.current = null;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setTaxonomyLoading(true);
      setError("");

      if (mode === "create") {
        resetCreateEditorState();
      }

      const [optionsResponse, seriesResponse] = await Promise.all([
        adminSeriesService.options(),
        mode === "edit" && seriesId
          ? adminSeriesService.show(seriesId)
          : Promise.resolve(null),
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

      if (optionsResponse.success && optionsResponse.data) {
        setStatusOptions([
          { value: "", label: "وضعیت نامشخص" },
          ...optionsResponse.data.production_statuses,
        ]);
        setTaxonomyGenres(nextGenres);
        setTaxonomyCountries(nextCountries);
        setTaxonomyLanguages(nextLanguages);
        if (optionsResponse.data.home_hero_slider) {
          setHomeHeroSlider(optionsResponse.data.home_hero_slider);
        }
      }
      setTaxonomyLoading(false);

      if (mode === "edit" && seriesId) {
        const response = seriesResponse;

        if (!(response?.success && response.data)) {
          setError(response?.message || "دریافت اطلاعات سریال انجام نشد.");
          setLoading(false);
          return;
        }

        const nextForm = alignSeriesFormTaxonomy(
          mapSeriesToForm(response.data.series),
          nextGenres,
          nextCountries,
          nextLanguages,
        );
        const seededHlsState = seedVerifiedEpisodeHlsSyncState(nextForm);
        setSeries(response.data.series);
        setForm(nextForm);
        setEntryMode(
          resolveContentEntryMode({
            savedSource: response.data.series.metadata?.content_source,
            tmdbId:
              response.data.series.metadata?.tmdb?.tmdb_id ?? nextForm.tmdb_id,
            isCreate: false,
          }),
        );
        setLastFetchedTmdbCode(
          normalizeTmdbCodeInput(nextForm.tmdb_id || nextForm.tmdb_query),
        );
        seriesFormBodyFingerprintRef.current = seriesFormBodyFingerprint(nextForm);
        setEpisodeSavedFingerprints(seedEpisodeSavedFingerprints(nextForm));
        lastCommittedSeriesHlsBaseRef.current = normalizeHlsBaseUrl(nextForm.hls_base_url);
        hlsAutoSyncBootstrappedRef.current = true;
        lastHlsFingerprintRef.current = buildHlsSyncFingerprint(nextForm);
        lastSyncedEpisodeHlsRef.current = { ...seededHlsState.cache };
        episodeHlsComparableMapRef.current = seededHlsState.comparables;
        setEpisodeHlsSyncMessage(seededHlsState.messages);
        setEpisodeHlsSyncPending({});
        setExpandedSeasonIds(
          nextForm.seasons.length > 0 ? [nextForm.seasons[0].id] : [],
        );
        setExpandedEpisodeKeys([]);
      }

      setLoading(false);
    };

    void loadData();
  }, [mode, seriesId, createInstanceKey]);

  useEffect(() => {
    if (searchParams.get("tab") === "publish") {
      setActiveTab("publish");
    }
  }, [searchParams]);

  const totalEpisodes = useMemo(
    () => form.seasons.reduce((sum, season) => sum + season.episodes.length, 0),
    [form.seasons],
  );

  const hasSubtitle = useMemo(
    () =>
      form.seasons.some((season) =>
        season.episodes.some(
          (episode) => episode.has_subtitle || episode.subtitle_url.trim() !== "",
        ),
      ),
    [form.seasons],
  );

  const hasDubbed = useMemo(
    () =>
      form.seasons.some((season) =>
        season.episodes.some(
          (episode) => episode.has_dubbed || episode.dubbed_audio_url.trim() !== "",
        ),
      ),
    [form.seasons],
  );

  const previewPosterImage = series?.poster_image ?? null;
  const previewBackdropImage = series?.backdrop_image ?? null;
  const previewPosterSources = buildAdminPreviewImageSources(
    previewPosterImage,
    form.poster_url,
    form.poster_source_url,
    series?.poster_url,
    series?.metadata?.tmdb?.poster_url,
    series?.metadata?.tmdb?.poster_source_url,
  );
  const previewBackdropSources = buildAdminPreviewImageSources(
    previewBackdropImage,
    form.backdrop_url,
    form.backdrop_source_url,
    series?.backdrop_url,
    series?.metadata?.tmdb?.backdrop_url,
    series?.metadata?.tmdb?.backdrop_source_url,
  );
  const previewPosterUrl = previewPosterSources.src ?? "";
  const previewPosterFallbackUrl = previewPosterSources.fallbackUrl;
  const previewBackdropUrl = previewBackdropSources.src ?? "";
  const previewBackdropFallbackUrl = previewBackdropSources.fallbackUrl;
  const sortedActorsWithIndex = useMemo(() => {
    const rows = form.actors
      .map((actor, index) => {
        const normalized = normalizeActor(actor);

        return normalized ? { actor: normalized, index } : null;
      })
      .filter(
        (row): row is { actor: AdminSeriesActor; index: number } => row !== null,
      );

    return sortCastRows(rows, (row) => row.actor);
  }, [form.actors]);
  const actorNames = useMemo(
    () => sortedActorsWithIndex.map((row) => row.actor.name || "").filter(Boolean),
    [sortedActorsWithIndex],
  );
  const submitButtonLabel = submitting
    ? submitStep || "در حال ثبت..."
    : "ثبت";
  const productionStatusLabel =
    translateProductionStatus(form.status) || "وضعیت نامشخص";
  const publishStatusLabel = translatePublishStatus(form.publish_status);
  const resolvedSlug =
    form.slug.trim() ||
    buildSlug(
      form.original_title,
      form.title,
      form.tmdb_id ? `series-${form.tmdb_id}` : null,
    ) ||
    "series-slug";

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

  const updateField = (field: keyof SeriesFormState, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const clearUnconfirmedEpisodeHlsLink = (seasonId: string, episodeId: string) => {
    setForm((current) => ({
      ...current,
      seasons: current.seasons.map((season) => {
        if (season.id !== seasonId) {
          return season;
        }

        const episodes = season.episodes.map((episode) =>
          episode.id === episodeId ? episodeWithoutUnconfirmedHlsLink(episode) : episode,
        );
        const stillHasHls = episodes.some(
          (episode) => episode.source_method === "hls" && episode.hls_url.trim(),
        );

        return {
          ...season,
          hls_base_url: stillHasHls ? season.hls_base_url : "",
          episodes,
        };
      }),
    }));
  };

  const routeSeriesPlaybackToConfirmedHls = async (formSnapshot: SeriesFormState) => {
    const seriesBase =
      normalizeHlsBaseUrl(formSnapshot.hls_base_url) ||
      inferSeriesHlsBaseFromEpisodeUrls(formSnapshot.seasons);
    const candidates = listUnconfirmedEpisodeHlsCandidates({
      ...formSnapshot,
      hls_base_url: seriesBase,
    });

    if (!seriesBase || candidates.length === 0) {
      setSeriesHlsSyncMessage(
        seriesBase
          ? "قسمت بدون مسیر برای پردازش HLS نیست."
          : "برای پردازش HLS، ریشه پکیج سریال را وارد کنید.",
      );
      return;
    }

    setSeriesHlsSyncMessage(
      "پردازش HLS شروع شد. لینک فقط برای قسمتی می‌ماند که پکیجش واقعاً خوانده شود.",
    );

    for (const target of candidates) {
      const syncKey = `${target.seasonId}:${target.episodeId}`;
      delete lastSyncedEpisodeHlsRef.current[syncKey];
      scheduleEpisodeHlsSyncRef.current?.(target.seasonId, target.episodeId, target.hlsUrl);
    }
  };

  const addArrayItems = (field: SeriesFreeArrayField, rawValue: string) => {
    const parsed = parseTagInput(rawValue);
    const personFields: SeriesFreeArrayField[] = ["directors", "writers", "creators"];
    const nextItems = personFields.includes(field)
      ? filterLatinPersonNameList(parsed)
      : parsed;

    if (!nextItems.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: Array.from(new Set([...(current[field] || []), ...nextItems])),
    }));
  };

  const removeArrayItem = (field: SeriesFreeArrayField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((item) => item !== value),
    }));
  };

  const handleArrayInputSubmit = (field: SeriesFreeArrayField) => {
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
    field: keyof AdminSeriesActor,
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
          episode_count: null,
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

  const seasonEpisodeKey = (seasonId: string, episodeId: string) => `${seasonId}:${episodeId}`;

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasonIds((current) =>
      current.includes(seasonId)
        ? current.filter((item) => item !== seasonId)
        : [...current, seasonId],
    );
  };

  const toggleEpisode = (seasonId: string, episodeId: string) => {
    const key = seasonEpisodeKey(seasonId, episodeId);
    const isExpanded = expandedEpisodeKeys.includes(key);

    setExpandedEpisodeKeys((current) =>
      isExpanded ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const flushEpisodeHlsBatchSync = () => {
    if (episodeHlsBatchDebounceTimerRef.current !== null) {
      window.clearTimeout(episodeHlsBatchDebounceTimerRef.current);
      episodeHlsBatchDebounceTimerRef.current = null;
    }

    setEpisodeHlsBatchScheduled(false);

    const previousComparables = episodeHlsBatchPreviousComparablesRef.current;
    const snapshot = formRef.current;

    episodeHlsBatchPreviousComparablesRef.current = null;

    if (previousComparables) {
      scheduleEpisodeHlsSyncAfterFormChange(previousComparables, snapshot);
    }
  };

  const scheduleEpisodeHlsBatchSyncDebounced = (
    previousComparables: Map<string, string>,
  ) => {
    episodeHlsBatchPreviousComparablesRef.current = previousComparables;
    setEpisodeHlsBatchScheduled(true);

    if (episodeHlsBatchDebounceTimerRef.current !== null) {
      window.clearTimeout(episodeHlsBatchDebounceTimerRef.current);
    }

    episodeHlsBatchDebounceTimerRef.current = window.setTimeout(() => {
      episodeHlsBatchDebounceTimerRef.current = null;
      flushEpisodeHlsBatchSync();
    }, 800);
  };

  function beginTmdbImageIngestSession() {
    tmdbImageIngestAbortRef.current?.abort();
    const abortController = new AbortController();
    tmdbImageIngestAbortRef.current = abortController;

    return abortController;
  }

  async function requestSeriesImageIngest(
    payload: ReturnType<typeof buildSeriesTmdbImageIngestPayload>,
    signal: AbortSignal,
  ): Promise<IngestTmdbImagesResult | null> {
    const response = await adminSeriesService.ingestTmdbImages(payload, { signal });

    if (signal.aborted || !response.success || !response.data) {
      return null;
    }

    return response.data;
  }

  async function runSeriesPrimaryImageIngest(
    formSnapshot: SeriesFormState,
    signal: AbortSignal,
  ): Promise<SeriesFormState> {
    if (!needsPrimaryImageIngest(formSnapshot)) {
      return formSnapshot;
    }

    let latestForm = formSnapshot;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (signal.aborted) {
        return latestForm;
      }

      const data = await requestSeriesImageIngest(
        buildSeriesTmdbImageIngestPayload({
          entityId: seriesId ?? null,
          ...buildSeriesPrimaryIngestSource(latestForm),
          includeSeasons: false,
        }),
        signal,
      );

      if (!data) {
        if (attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
        }
        continue;
      }

      latestForm = {
        ...applyIngestedPrimaryImages(latestForm, data, {
          poster_url: latestForm.poster_source_url || latestForm.poster_url,
          backdrop_url: latestForm.backdrop_source_url || latestForm.backdrop_url,
        }),
        actors: data.actors?.length
          ? mergeIngestedActorProfiles(latestForm.actors, data.actors)
          : latestForm.actors,
      };

      if (!needsPrimaryImageIngest(latestForm)) {
        break;
      }

      if (attempt < 2) {
        await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
      }
    }

    formRef.current = latestForm;
    setForm(latestForm);

    return latestForm;
  }

  async function runSeriesSeasonImageIngest(
    season: SeasonDraft,
    signal: AbortSignal,
  ): Promise<void> {
    const data = await requestSeriesImageIngest(
      buildSeriesTmdbImageIngestPayload({
        entityId: seriesId ?? null,
        ...buildSeriesSeasonIngestSource(season),
        includeSeasons: true,
      }),
      signal,
    );

    if (!data) {
      return;
    }

    setForm((current) => ({
      ...current,
      seasons: applyIngestedSeasonImages(current.seasons, data.seasons),
    }));
  }

  async function runSeriesImageIngestPipeline(
    formSnapshot: SeriesFormState,
    signal: AbortSignal,
    scope: "primary-only" | "seasons-only" | "full",
    seasons?: SeasonDraft[],
    options: { announceStart?: boolean; announceComplete?: boolean } = {},
  ): Promise<void> {
    const announceStart = options.announceStart ?? true;
    const announceComplete = options.announceComplete ?? true;

    if (announceStart) {
      setIngestingTmdbImages(true);
      setSearchMessage((current) =>
        withTmdbImageProcessingMessage(current, "پردازش تصاویر در حال انجام است."),
      );
    }

    try {
      if (scope === "primary-only" || scope === "full") {
        await runSeriesPrimaryImageIngest(formSnapshot, signal);
      }

      if (signal.aborted) {
        return;
      }

      if (scope === "seasons-only" || scope === "full") {
        const targetSeasons = seasons ?? formSnapshot.seasons;

        for (const season of targetSeasons) {
          if (signal.aborted) {
            return;
          }

          await runSeriesSeasonImageIngest(season, signal);
        }
      }

      if (!signal.aborted && announceComplete) {
        setSearchMessage((current) => finalizeTmdbImageIngestMessage(current));
      }
    } catch (ingestError) {
      if (ingestError instanceof Error && ingestError.name === "AbortError") {
        return;
      }
    } finally {
      if (!signal.aborted && announceComplete) {
        setIngestingTmdbImages(false);
      }
    }
  }

  async function fetchAndApplyTmdb(
    tmdbId: string,
    nextMessage?: string,
    baseForm?: SeriesFormState,
    options?: { appendMissing?: boolean },
  ) {
    const normalizedId = normalizeTmdbCodeInput(tmdbId);
    if (!normalizedId) {
      setError("کد TMDb معتبر نیست.");
      return;
    }

    const excludeId = series?.id ?? seriesId;
    const uniqueness = await adminSeriesService.checkTmdbId(normalizedId, excludeId);
    if (uniqueness.success && uniqueness.data && !uniqueness.data.available) {
      const existing = uniqueness.data.existing;
      const message = existing?.title
        ? `این کد TMDb قبلاً برای «${existing.title}» (#${existing.id}) ثبت شده است. از ویرایش همان سریال استفاده کنید.`
        : "این کد TMDb قبلاً ثبت شده است.";
      setError(message);
      setTabFieldErrors((current) => ({ ...current, tmdb_id: message }));
      setActiveTab("identity");
      setSearchingTmdb(false);
      setFetchingTmdb(false);
      setTmdbSyncState({ ...initialTmdbSyncState, phase: "error" });
      return;
    }

    tmdbAbortControllerRef.current?.abort();
    const imageSession = beginTmdbImageIngestSession();
    const abortController = new AbortController();
    tmdbAbortControllerRef.current = abortController;
    const { signal } = abortController;

    setFetchingTmdb(true);
    setTmdbSyncState({
      phase: "fetching_overview",
      overviewReady: false,
      seasonProgress: [],
    });
    setError("");

    try {
      const overviewResponse = await adminSeriesService.fetchTmdb(normalizedId, {
        includeSeasons: false,
        signal,
      });

      if (signal.aborted) {
        return;
      }

      if (!(overviewResponse.success && overviewResponse.data)) {
        const firstError = overviewResponse.errors
          ? Object.values(overviewResponse.errors)[0]?.[0]
          : undefined;
        setError(
          firstError || overviewResponse.message || "دریافت اطلاعات سریال از TMDb انجام نشد.",
        );
        setTmdbSyncState({ ...initialTmdbSyncState, phase: "error" });
        return;
      }

      const overview = overviewResponse.data.series;
      const seasonNumbers = resolveSeasonNumbersForTmdbSync(
        overview,
        (baseForm ?? formRef.current).tmdb_excluded_season_numbers,
      );

      const overviewForm = alignSeriesFormTaxonomy(
        applyTmdbSeriesOverviewToForm(
          baseForm ?? formRef.current,
          overview,
          String(tmdbId),
        ),
        taxonomyGenres,
        taxonomyCountries,
        taxonomyLanguages,
      );
      setForm(overviewForm);

      let primaryIngestPromise: Promise<void> | null = null;

      if (seasonNumbers.length > 0) {
        primaryIngestPromise = runSeriesImageIngestPipeline(
          overviewForm,
          imageSession.signal,
          "primary-only",
          undefined,
          { announceStart: true, announceComplete: false },
        );
      }

      setFetchingTmdb(false);
      setTmdbSyncState({
        phase: seasonNumbers.length > 0 ? "fetching_seasons" : "done",
        overviewReady: true,
        seasonProgress: seasonNumbers.map((seasonNumber) => ({
          season_number: seasonNumber,
          status: "pending",
        })),
      });
      setLastFetchedTmdbCode(String(overview.tmdb_id ?? tmdbId));
      setSearchMessage("اطلاعات سریال از TMDb اعمال شد؛ فصل‌ها در حال بارگذاری هستند.");

      if (seasonNumbers.length === 0) {
        const finalizedOverviewForm = finalizeTmdbSeriesSyncExclusions(overviewForm);
        setForm(finalizedOverviewForm);
        setSearchMessage(
          nextMessage || "اطلاعات سریال از TMDb روی فرم اعمال شد.",
        );
        await runSeriesImageIngestPipeline(
          finalizedOverviewForm,
          imageSession.signal,
          "primary-only",
        );
        return;
      }

      setTmdbSyncState((current) => ({
        ...current,
        seasonProgress: current.seasonProgress.map((row) => ({
          ...row,
          status: "loading",
        })),
      }));

      const seasonFetchPromise = fetchTmdbSeasonsWithConcurrency(
        seasonNumbers,
        (seasonNumber) =>
          adminSeriesService.fetchTmdbSeason(tmdbId, seasonNumber, { signal }),
        { concurrency: 4, signal },
      );

      const [seasonFetchRows] = await Promise.all([
        seasonFetchPromise,
        primaryIngestPromise ?? Promise.resolve(),
      ]);

      if (signal.aborted) {
        imageSession.abort();
        setIngestingTmdbImages(false);
        return;
      }

      let latestForm = formRef.current;

      for (const { seasonNumber, settled } of seasonFetchRows) {
        if (
          settled.status === "fulfilled" &&
          settled.value.success &&
          settled.value.data?.season
        ) {
          latestForm = preserveIngestedPrimaryImages(
            applyTmdbSeasonToForm(
              latestForm,
              settled.value.data.season,
              options?.appendMissing ? { appendMissing: true } : { fullSeasonResync: true },
            ),
            formRef.current,
          );
          setForm(latestForm);

          const mergedSeason = latestForm.seasons.find(
            (season) => season.season_number.trim() === String(seasonNumber),
          );

          if (mergedSeason) {
            setExpandedSeasonIds((current) =>
              current.includes(mergedSeason.id) ? current : [...current, mergedSeason.id],
            );
          }

          setTmdbSyncState((current) => ({
            ...current,
            seasonProgress: current.seasonProgress.map((row) =>
              row.season_number === seasonNumber
                ? { ...row, status: "done", error: undefined }
                : row,
            ),
          }));
        } else {
          const errorMessage = resolveTmdbSeasonFetchErrorMessage(settled);

          setTmdbSyncState((current) => ({
            ...current,
            seasonProgress: current.seasonProgress.map((row) =>
              row.season_number === seasonNumber
                ? { ...row, status: "error", error: errorMessage }
                : row,
            ),
          }));
        }
      }

      if (signal.aborted) {
        return;
      }

      const finalizedForm = finalizeTmdbSeriesSyncExclusions(latestForm);
      const discoveryGroups = options?.appendMissing
        ? []
        : buildEmptyEpisodeHlsDiscoveryGroups(finalizedForm);

      if (discoveryGroups.length > 0) {
        setEpisodeHlsSyncPending((current) => {
          const next = { ...current };

          for (const group of discoveryGroups) {
            for (const target of group.targetByKey.values()) {
              next[seasonEpisodeKey(target.seasonId, target.episodeId)] = true;
            }
          }

          return next;
        });
      }

      const { nextForm: formWithHls, filled: filledHlsTargets } = options?.appendMissing
        ? { nextForm: finalizedForm, filled: [] as EpisodeHlsSyncTarget[] }
        : await discoverAndFillEmptyEpisodeHls(finalizedForm);
      const formWithPreservedPrimaryImages = preserveIngestedPrimaryImages(
        formWithHls,
        formRef.current,
      );
      formRef.current = formWithPreservedPrimaryImages;
      setForm(formWithPreservedPrimaryImages);

      if (discoveryGroups.length > 0) {
        const filledKeys = new Set(
          filledHlsTargets.map((target) =>
            seasonEpisodeKey(target.seasonId, target.episodeId),
          ),
        );

        for (const group of discoveryGroups) {
          for (const target of group.targetByKey.values()) {
            const syncKey = seasonEpisodeKey(target.seasonId, target.episodeId);

            if (filledKeys.has(syncKey)) {
              continue;
            }

            clearEpisodeHlsSyncPending(syncKey);
            setEpisodeHlsSyncMessage((current) => ({
              ...current,
              [syncKey]: HLS_NOT_READY_MESSAGE,
            }));
          }
        }
      }

      await runSeriesImageIngestPipeline(
        formWithPreservedPrimaryImages,
        imageSession.signal,
        "seasons-only",
        formWithPreservedPrimaryImages.seasons,
        { announceStart: false, announceComplete: true },
      );

      if (!imageSession.signal.aborted) {
        await runSeriesPrimaryImageIngest(formRef.current, imageSession.signal);
      }

      setExpandedEpisodeKeys([]);
      episodeHlsComparableMapRef.current = buildEpisodeHlsComparableMap(
        formWithPreservedPrimaryImages,
      );
      lastHlsFingerprintRef.current = buildHlsSyncFingerprint(formWithPreservedPrimaryImages);
      hlsAutoSyncBootstrappedRef.current = true;

      if (options?.appendMissing) {
        void routeSeriesPlaybackToConfirmedHls(formRef.current);
      } else if (filledHlsTargets.length > 0) {
        void scheduleEpisodeHlsSyncForForm(formWithHls, { targets: filledHlsTargets });
      }
      setTmdbSyncState({
        phase: "done",
        overviewReady: true,
        seasonProgress: seasonFetchRows.map(({ seasonNumber, settled }) => ({
          season_number: seasonNumber,
          status:
            settled.status === "fulfilled" &&
            settled.value.success &&
            settled.value.data?.season
              ? "done"
              : "error",
          error:
            settled.status === "fulfilled" &&
            settled.value.success &&
            settled.value.data?.season
              ? undefined
              : resolveTmdbSeasonFetchErrorMessage(settled),
        })),
      });
      if (!imageSession.signal.aborted) {
        setSearchMessage(
          nextMessage || finalizeTmdbImageIngestMessage("اطلاعات سریال و فصل‌ها از TMDB روی فرم اعمال شد."),
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setError(
        error instanceof Error ? error.message : "دریافت اطلاعات سریال از TMDb انجام نشد.",
      );
      setTmdbSyncState({ ...initialTmdbSyncState, phase: "error" });
    } finally {
      if (!signal.aborted) {
        setFetchingTmdb(false);
      }
    }
  }

  async function syncTmdbSeason(
    seasonNumber: string | number,
    baseForm?: SeriesFormState,
    nextMessage?: string,
    options?: MergeSeasonFromTmdbOptions,
  ) {
    const formBase = baseForm ?? formRef.current;
    const tmdbId = formBase.tmdb_id.trim() || formBase.tmdb_query.trim();

    if (!tmdbId) {
      setSearchMessage("برای همگام‌سازی فصل/قسمت، ابتدا کد TMDb سریال را در تب اطلاعات وارد کن.");
      return;
    }

    tmdbAbortControllerRef.current?.abort();
    const imageSession = beginTmdbImageIngestSession();
    const abortController = new AbortController();
    tmdbAbortControllerRef.current = abortController;
    const { signal } = abortController;

    setFetchingTmdb(true);
    setError("");

    const response = await adminSeriesService.fetchTmdbSeason(tmdbId, seasonNumber, {
      signal,
    });

    if (signal.aborted) {
      setFetchingTmdb(false);
      return;
    }

    if (response.success && response.data?.season) {
      let nextFormSnapshot: SeriesFormState | undefined;

      setForm((current) => {
        const nextForm = applyTmdbSeasonToForm(
          baseForm ?? current,
          response.data!.season,
          options,
        );
        nextFormSnapshot = nextForm;
        return nextForm;
      });

      if (nextFormSnapshot) {
        const discoveryGroups = buildEmptyEpisodeHlsDiscoveryGroups(nextFormSnapshot);

        if (discoveryGroups.length > 0) {
          setEpisodeHlsSyncPending((current) => {
            const next = { ...current };

            for (const group of discoveryGroups) {
              for (const target of group.targetByKey.values()) {
                next[seasonEpisodeKey(target.seasonId, target.episodeId)] = true;
              }
            }

            return next;
          });
        }

        const { nextForm: formWithHls, filled: filledHlsTargets } =
          await discoverAndFillEmptyEpisodeHls(nextFormSnapshot);

        if (filledHlsTargets.length > 0) {
          setForm(formWithHls);
          nextFormSnapshot = formWithHls;
        }

        if (discoveryGroups.length > 0) {
          const filledKeys = new Set(
            filledHlsTargets.map((target) =>
              seasonEpisodeKey(target.seasonId, target.episodeId),
            ),
          );

          for (const group of discoveryGroups) {
            for (const target of group.targetByKey.values()) {
              const syncKey = seasonEpisodeKey(target.seasonId, target.episodeId);

              if (filledKeys.has(syncKey)) {
                continue;
              }

              clearEpisodeHlsSyncPending(syncKey);
              setEpisodeHlsSyncMessage((current) => ({
                ...current,
                [syncKey]: HLS_NOT_READY_MESSAGE,
              }));
            }
          }
        }

        episodeHlsComparableMapRef.current = buildEpisodeHlsComparableMap(nextFormSnapshot);
        lastHlsFingerprintRef.current = buildHlsSyncFingerprint(nextFormSnapshot);
        hlsAutoSyncBootstrappedRef.current = true;

        if (filledHlsTargets.length > 0) {
          void scheduleEpisodeHlsSyncForForm(nextFormSnapshot, { targets: filledHlsTargets });
        }

        const mergedSeason = nextFormSnapshot.seasons.find(
          (season) => season.season_number.trim() === String(seasonNumber).trim(),
        );

        if (mergedSeason) {
          setExpandedSeasonIds((current) =>
            current.includes(mergedSeason.id) ? current : [...current, mergedSeason.id],
          );
          await runSeriesImageIngestPipeline(
            nextFormSnapshot,
            imageSession.signal,
            "seasons-only",
            [mergedSeason],
          );
        }
      }

      if (!imageSession.signal.aborted) {
        setSearchMessage(
          nextMessage ||
            finalizeTmdbImageIngestMessage(`فصل ${seasonNumber} از TMDb همگام‌سازی شد.`),
        );
      }
    } else {
      const firstError = response.errors ? Object.values(response.errors)[0]?.[0] : undefined;
      setError(firstError || response.message || "دریافت فصل از TMDb انجام نشد.");
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

  const isManualMode = entryMode === "manual";

  const isIdentityTabComplete = isManualMode
    ? form.title.trim() !== "" &&
      form.original_title.trim() !== "" &&
      form.slug.trim() !== "" &&
      form.synopsis.trim() !== "" &&
      isAgeRatingSelected(form.age_rating, ageRatingValues) &&
      form.genres.length > 0 &&
      form.countries.length > 0 &&
      form.languages.length > 0
    : form.tmdb_id.trim() !== "" &&
      form.title.trim() !== "" &&
      buildSlug(
        form.slug,
        form.original_title,
        form.title,
        form.tmdb_id ? `series-${form.tmdb_id}` : null,
      ) !== "" &&
      form.synopsis.trim() !== "" &&
      isAgeRatingSelected(form.age_rating, ageRatingValues);

  const isCatalogTabComplete = isManualMode
    ? form.poster_url.trim() !== "" && form.backdrop_url.trim() !== ""
    : true;

  const isSeasonsStructureComplete =
    form.seasons.length > 0 &&
    form.seasons.every(
      (season) =>
        season.season_number.trim() !== "" &&
        season.episodes.length > 0 &&
        season.episodes.every((episode) => episode.episode_number.trim() !== ""),
    );

  const isSeasonsTabComplete = isManualMode
    ? form.seasons.length === 0 || isSeasonsStructureComplete
    : isSeasonsStructureComplete;
  const isPublishScheduleComplete =
    form.publish_status !== "scheduled" || form.scheduled_for.trim() !== "";

  const slugAvailability = useSlugAvailability({
    slug: form.slug,
    excludeId: series?.id ?? seriesId,
    check: adminSeriesService.checkSlug,
  });

  const tmdbCodeForAvailability = normalizeTmdbCodeInput(
    form.tmdb_query || form.tmdb_id,
  );

  const tmdbAvailability = useTmdbIdAvailability({
    tmdbId: tmdbCodeForAvailability,
    excludeId: series?.id ?? seriesId,
    check: adminSeriesService.checkTmdbId,
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

  useEffect(() => {
    if (mode !== "create" || loading || entryMode !== "tmdb") {
      return;
    }

    const tmdbCode = normalizeTmdbCodeInput(form.tmdb_query);

    if (!tmdbCode || tmdbCode === lastFetchedTmdbCode) {
      return;
    }

    // Wait until uniqueness check finishes; never auto-fetch a taken TMDb id.
    if (tmdbAvailability.isChecking || tmdbAvailability.isTaken) {
      return;
    }

    if (tmdbAvailability.status !== "available") {
      return;
    }

    const timer = window.setTimeout(() => {
      void handleAutoTmdbFetch(tmdbCode);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    form.tmdb_query,
    mode,
    loading,
    lastFetchedTmdbCode,
    entryMode,
    tmdbAvailability.isChecking,
    tmdbAvailability.isTaken,
    tmdbAvailability.status,
  ]);

  const canSubmitForm =
    isIdentityTabComplete &&
    isCatalogTabComplete &&
    isSeasonsTabComplete &&
    isPublishScheduleComplete &&
    !slugAvailability.isChecking &&
    !slugAvailability.isTaken &&
    !tmdbAvailability.isChecking &&
    !tmdbAvailability.isTaken;
  const hasSeasonHlsCascadePending = Object.keys(seasonHlsCascadePendingKeys).length > 0;
  const hasEpisodeHlsSyncPending = Object.keys(episodeHlsSyncPending).length > 0;
  const isSeriesHlsProcessing =
    seriesHlsCascadePending ||
    hasSeasonHlsCascadePending ||
    episodeHlsBatchScheduled ||
    episodeHlsPreviewActive ||
    hasEpisodeHlsSyncPending;
  const isSubmitBlockedByBackgroundProcessing =
    ingestingTmdbImages || isSeriesHlsProcessing;
  const submitBlockedHint = ingestingTmdbImages
    ? "تا پایان پردازش تصاویر، ثبت فرم موقتاً غیرفعال است."
    : isSeriesHlsProcessing
      ? "تا پایان پردازش HLS ریشه/فصل/قسمت‌ها، ثبت فرم موقتاً غیرفعال است."
      : null;

  const canProceedToNextTab =
    activeTab === "identity"
      ? isIdentityTabComplete && !tmdbAvailability.isTaken && !tmdbAvailability.isChecking
      : activeTab === "catalog"
        ? isCatalogTabComplete
        : activeTab === "seo"
          ? true
          : activeTab === "seasons"
            ? isSeasonsTabComplete
            : false;

  const canAccessTab = (target: SeriesEditorTab) => {
    if (target === "identity") {
      return true;
    }

    const identityOk =
      isIdentityTabComplete && !tmdbAvailability.isTaken && !tmdbAvailability.isChecking;

    if (target === "catalog") {
      return identityOk;
    }

    if (target === "seo" || target === "seasons") {
      return identityOk && isCatalogTabComplete;
    }

    if (target === "publish") {
      return identityOk && isCatalogTabComplete && isSeasonsTabComplete;
    }

    return false;
  };

  const prepareFieldFocus = (field: string) => {
    const seasonId = parseSeriesSeasonFieldKey(field);
    const episodeRef = parseSeriesEpisodeFieldKey(field);

    if (seasonId) {
      setExpandedSeasonIds((current) =>
        current.includes(seasonId) ? current : [...current, seasonId],
      );
    }

    if (episodeRef) {
      const episodeKey = seasonEpisodeKey(episodeRef.seasonId, episodeRef.episodeId);
      setExpandedSeasonIds((current) =>
        current.includes(episodeRef.seasonId) ? current : [...current, episodeRef.seasonId],
      );
      setExpandedEpisodeKeys((current) =>
        current.includes(episodeKey) ? current : [...current, episodeKey],
      );
    }
  };

  const applyTabFieldIssues = (
    issues: ReturnType<typeof validateSeriesTab>,
  ): boolean => {
    if (issues.length === 0) {
      return false;
    }

    prepareFieldFocus(issues[0].field);
    setTabFieldErrors(issuesToErrorMap(issues));
    setError(issues[0].message);
    window.setTimeout(() => scrollToFormField(issues[0].field), 120);
    return true;
  };

  const goToTab = (target: SeriesEditorTab) => {
    if (target !== "identity") {
      const identityIssues = validateSeriesIdentityTab(
        form,
        buildSlug,
        ageRatingValues,
        entryMode,
      );

      if (identityIssues.length > 0) {
        if (activeTab !== "identity") {
          setActiveTab("identity");
        }

        applyTabFieldIssues(identityIssues);
        return;
      }
    }

    if (target === "seo" || target === "seasons" || target === "publish") {
      const catalogIssues = validateSeriesCatalogTab(form, entryMode);

      if (catalogIssues.length > 0) {
        if (activeTab !== "catalog") {
          setActiveTab("catalog");
        }

        applyTabFieldIssues(catalogIssues);
        return;
      }
    }

    if (target === "publish") {
      const seasonsIssues = validateSeriesSeasonsTab(form, entryMode);

      if (seasonsIssues.length > 0) {
        if (activeTab !== "seasons") {
          setActiveTab("seasons");
        }

        applyTabFieldIssues(seasonsIssues);
        return;
      }
    }

    if (!canAccessTab(target)) {
      setError(
        target === "publish"
          ? "ابتدا اطلاعات اصلی سریال و فصل ها و قسمت ها را کامل کن."
          : target === "seo" || target === "seasons"
            ? "ابتدا پوستر و تصویر پس‌زمینه را کامل کن."
            : "ابتدا اطلاعات اصلی سریال را کامل کن.",
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

    const issues = validateSeriesTab(activeTab, form, buildSlug, ageRatingValues, entryMode);

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

  const updateSeason = (seasonId: string, patch: Partial<SeasonDraft>) => {
    setForm((current) => ({
      ...current,
      seasons: current.seasons.map((season) =>
        season.id === seasonId ? { ...season, ...patch } : season,
      ),
    }));
  };

  const updateEpisode = (
    seasonId: string,
    episodeId: string,
    patch: Partial<EpisodeDraft>,
  ) => {
    setForm((current) => ({
      ...current,
      seasons: current.seasons.map((season) =>
        season.id === seasonId
          ? {
              ...season,
              episodes: season.episodes.map((episode) =>
                episode.id === episodeId ? { ...episode, ...patch } : episode,
              ),
            }
          : season,
      ),
    }));
  };

  const invalidateEpisodeHlsSyncCache = (
    targets: EpisodeHlsSyncTarget[],
  ) => {
    for (const target of targets) {
      const key = seasonEpisodeKey(target.seasonId, target.episodeId);
      delete lastSyncedEpisodeHlsRef.current[key];
    }
  };

  const setEpisodeHlsSyncPendingForTargets = (
    targets: EpisodeHlsSyncTarget[],
    pending: boolean,
  ) => {
    setEpisodeHlsSyncPending((current) => {
      const next = { ...current };

      for (const target of targets) {
        const key = seasonEpisodeKey(target.seasonId, target.episodeId);

        if (pending) {
          next[key] = true;
        } else {
          delete next[key];
        }
      }

      return next;
    });
  };

  const clearEpisodeHlsSyncPending = (key: string) => {
    setEpisodeHlsSyncPending((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const drainEpisodeHlsPreviewQueue = async () => {
    if (episodeHlsPreviewRunningRef.current) {
      return;
    }

    episodeHlsPreviewRunningRef.current = true;
    setEpisodeHlsPreviewActive(true);

    try {
      while (episodeHlsPreviewQueueRef.current.length > 0) {
        const batch = episodeHlsPreviewQueueRef.current.splice(0, HLS_PREVIEW_CONCURRENCY);
        await Promise.all(batch.map((task) => task()));
      }
    } finally {
      episodeHlsPreviewRunningRef.current = false;
      const hasQueuedTasks = episodeHlsPreviewQueueRef.current.length > 0;
      setEpisodeHlsPreviewActive(hasQueuedTasks);

      if (hasQueuedTasks) {
        void drainEpisodeHlsPreviewQueue();
      }
    }
  };

  const enqueueEpisodeHlsPreview = (task: () => Promise<void>) => {
    episodeHlsPreviewQueueRef.current.push(task);
    void drainEpisodeHlsPreviewQueue();
  };

  const scheduleEpisodeHlsSync = (
    seasonId: string,
    episodeId: string,
    hlsUrl: string,
  ) => {
    const key = seasonEpisodeKey(seasonId, episodeId);
    const raw = toMasterPlaylistUrl(hlsUrl);

    if (!raw) {
      delete lastSyncedEpisodeHlsRef.current[key];
      clearEpisodeHlsSyncPending(key);
      setEpisodeHlsSyncMessage((current) => {
        if (!(key in current)) {
          return current;
        }

        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }

    const comparable = comparableHlsPlaylistUrl(raw);

    const snapshot = formRef.current;
    const season = snapshot.seasons.find((row) => row.id === seasonId);
    const episode = season?.episodes.find((row) => row.id === episodeId);

    if (
      episode?.hls_verified &&
      episode.hls_url.trim() &&
      resolveEpisodeComparableHlsUrl(snapshot, season!, episode) === comparable
    ) {
      lastSyncedEpisodeHlsRef.current[key] = comparable;
      clearEpisodeHlsSyncPending(key);
      return;
    }

    const cachedSync = lastSyncedEpisodeHlsRef.current[key];
    if (cachedSync === comparable || cachedSync === `miss:${comparable}`) {
      clearEpisodeHlsSyncPending(key);
      return;
    }

    const generation = (episodeHlsSyncGenerationRef.current[key] ?? 0) + 1;
    episodeHlsSyncGenerationRef.current[key] = generation;

    setEpisodeHlsSyncPending((current) => ({
      ...current,
      [key]: true,
    }));

    enqueueEpisodeHlsPreview(async () => {
      const runGeneration = generation;

      try {
        if (episodeHlsSyncGenerationRef.current[key] !== runGeneration) {
          return;
        }

        const response = await adminMoviesService.previewHlsPackage(raw, {
          resolveDownloads: false,
        });

        if (episodeHlsSyncGenerationRef.current[key] !== runGeneration) {
          return;
        }

        const payload = unwrapHlsPackagePreview(response);

        if (!payload) {
          const firstError = response.errors
            ? Object.values(response.errors)[0]?.[0]
            : undefined;

          lastSyncedEpisodeHlsRef.current[key] = `miss:${comparable}`;
          clearUnconfirmedEpisodeHlsLink(seasonId, episodeId);
          setEpisodeHlsSyncMessage((current) => ({
            ...current,
            [key]:
              firstError ||
              response.message ||
              HLS_NOT_READY_DETAILED_MESSAGE,
          }));
          return;
        }

        const nextSubtitle =
          payload.subtitle_source_url != null &&
          String(payload.subtitle_source_url).trim() !== ""
            ? String(payload.subtitle_source_url).trim()
            : null;
        const dubbedFromPayload =
          payload.dubbed_audio_url != null &&
          String(payload.dubbed_audio_url).trim() !== ""
            ? String(payload.dubbed_audio_url).trim()
            : null;
        const dubbedFromTrack =
          !dubbedFromPayload && payload.has_dubbed_audio
            ? payload.audio_tracks
                .map((track) => track.source_url?.trim() || "")
                .find((url) => url.length > 0) || null
            : null;

        setForm((current) => ({
          ...current,
          seasons: current.seasons.map((season) =>
            season.id !== seasonId
              ? season
              : {
                  ...season,
                  hls_base_url:
                    parseHlsPackagePath(payload.canonical_hls_url || raw)?.seasonBase ||
                    season.hls_base_url,
                  episodes: season.episodes.map((episode) => {
                    if (episode.id !== episodeId) {
                      return episode;
                    }

                    return {
                      ...episode,
                      hls_url: payload.canonical_hls_url || raw,
                      hls_verified: true,
                      dash_url:
                        payload.dash_url != null && String(payload.dash_url).trim() !== ""
                          ? String(payload.dash_url).trim()
                          : episode.dash_url,
                      dash_verified: Boolean(payload.dash_verified ?? payload.dash_url),
                      download_links:
                        payload.download_links && Object.keys(payload.download_links).length > 0
                          ? payload.download_links
                          : episode.download_links,
                      source_method: "hls",
                      subtitle_url: nextSubtitle ?? episode.subtitle_url,
                      has_subtitle:
                        Boolean(nextSubtitle) ||
                        Boolean(payload.has_subtitle) ||
                        episode.has_subtitle,
                      dubbed_audio_url:
                        dubbedFromPayload ?? dubbedFromTrack ?? episode.dubbed_audio_url,
                      has_dubbed:
                        Boolean(dubbedFromPayload || dubbedFromTrack) ||
                        Boolean(payload.has_dubbed_audio) ||
                        episode.has_dubbed,
                    };
                  }),
                },
          ),
        }));

        lastSyncedEpisodeHlsRef.current[key] = comparableHlsPlaylistUrl(
          payload.canonical_hls_url || raw,
        );

        setEpisodeHlsSyncMessage((current) => ({
          ...current,
          [key]:
            payload.download_links && Object.keys(payload.download_links).length > 0
              ? nextSubtitle || dubbedFromPayload || dubbedFromTrack
                ? "مسیر HLS، زیرنویس، دوبله و لینک‌های دانلود همگام شد."
                : "مسیر HLS و لینک‌های دانلود همگام شد."
              : nextSubtitle || dubbedFromPayload || dubbedFromTrack
                ? "زیرنویس و دوبله از پکیج HLS همگام شد."
                : "مسیر HLS ثبت شد؛ زیرنویس یا دوبله در پکیج یافت نشد.",
        }));
      } catch (error) {
        if (episodeHlsSyncGenerationRef.current[key] !== runGeneration) {
          return;
        }

        lastSyncedEpisodeHlsRef.current[key] = `miss:${comparable}`;
        clearUnconfirmedEpisodeHlsLink(seasonId, episodeId);
        setEpisodeHlsSyncMessage((current) => ({
          ...current,
          [key]:
            error instanceof Error
              ? error.message
              : HLS_NOT_READY_DETAILED_MESSAGE,
        }));
      } finally {
        if (episodeHlsSyncGenerationRef.current[key] === runGeneration) {
          clearEpisodeHlsSyncPending(key);
        }
      }
    });
  };

  scheduleEpisodeHlsSyncRef.current = scheduleEpisodeHlsSync;

  const applyHlsExistsCheckResults = (
    items: Array<{
      season: number;
      episode: number;
      exists: boolean;
      hls_url?: string | null;
    }>,
    targetByKey: Map<string, EpisodeHlsSyncTarget>,
    handledSyncKeys: Set<string>,
  ) => {
    for (const item of items) {
      const key = hlsExistsEpisodeKey(item.season, item.episode);
      const target = targetByKey.get(key);

      if (!target) {
        continue;
      }

      const syncKey = seasonEpisodeKey(target.seasonId, target.episodeId);
      handledSyncKeys.add(syncKey);

      if (item.exists) {
        const resolvedUrl = toMasterPlaylistUrl(item.hls_url?.trim() || target.hlsUrl);

        if (item.hls_url?.trim() && item.hls_url.trim() !== target.hlsUrl) {
          setForm((current) => ({
            ...current,
            seasons: current.seasons.map((season) =>
              season.id !== target.seasonId
                ? season
                : {
                    ...season,
                    episodes: season.episodes.map((episode) =>
                      episode.id !== target.episodeId
                        ? episode
                        : {
                            ...episode,
                            hls_url: item.hls_url!.trim(),
                            hls_verified: false,
                          },
                    ),
                  },
            ),
          }));
        }

        scheduleEpisodeHlsSync(target.seasonId, target.episodeId, resolvedUrl);
        continue;
      }

      const comparable = comparableHlsPlaylistUrl(target.hlsUrl);
      lastSyncedEpisodeHlsRef.current[syncKey] = `miss:${comparable}`;
      clearEpisodeHlsSyncPending(syncKey);
      setEpisodeHlsSyncMessage((current) => ({
        ...current,
        [syncKey]: HLS_NOT_READY_MESSAGE,
      }));
    }
  };

  const scheduleEpisodeHlsSyncForForm = async (
    formState: SeriesFormState,
    options?: { seasonId?: string; targets?: EpisodeHlsSyncTarget[] },
  ) => {
    const targets =
      options?.targets ??
      collectEpisodeHlsSyncTargets(
        formState,
        options?.seasonId ? { seasonId: options.seasonId } : undefined,
      );
    invalidateEpisodeHlsSyncCache(targets);

    if (targets.length === 0) {
      return;
    }

    const existsGroups = buildHlsExistsCheckGroups({
      seriesBaseUrl: formState.hls_base_url,
      seasons: formState.seasons,
      targets,
    });

    const groupedTargets = new Set(
      existsGroups.flatMap((group) =>
        Array.from(group.targetByKey.values()).map(
          (target) => `${target.seasonId}:${target.episodeId}`,
        ),
      ),
    );
    const ungroupedTargets = targets.filter(
      (target) => !groupedTargets.has(`${target.seasonId}:${target.episodeId}`),
    );

    if (existsGroups.length === 0) {
      for (const target of targets) {
        scheduleEpisodeHlsSync(target.seasonId, target.episodeId, target.hlsUrl);
      }
      return;
    }

    setEpisodeHlsSyncPendingForTargets(targets, true);
    setEpisodeHlsSyncMessage((current) => {
      const next = { ...current };

      for (const target of targets) {
        const syncKey = seasonEpisodeKey(target.seasonId, target.episodeId);
        const message = next[syncKey];

        if (message?.includes("آماده نیست")) {
          delete next[syncKey];
        }
      }

      return next;
    });

    const handledSyncKeys = new Set<string>();

    try {
      await Promise.all(
        existsGroups.map(async (group) => {
          const response = await adminMoviesService.checkHlsExists(
            group.baseUrl,
            group.episodes,
          );
          const items = unwrapCheckHlsExistsItems(response);
          applyHlsExistsCheckResults(items, group.targetByKey, handledSyncKeys);
        }),
      );
    } catch {
      setEpisodeHlsSyncPendingForTargets(targets, false);

      for (const target of targets) {
        scheduleEpisodeHlsSync(target.seasonId, target.episodeId, target.hlsUrl);
      }

      return;
    }

    for (const target of targets) {
      const syncKey = seasonEpisodeKey(target.seasonId, target.episodeId);

      if (!handledSyncKeys.has(syncKey)) {
        clearEpisodeHlsSyncPending(syncKey);
        setEpisodeHlsSyncMessage((current) => ({
          ...current,
          [syncKey]: "شناسایی وضعیت HLS برای این قسمت انجام نشد.",
        }));
      }
    }

    for (const target of ungroupedTargets) {
      const syncKey = seasonEpisodeKey(target.seasonId, target.episodeId);

      if (!handledSyncKeys.has(syncKey)) {
        scheduleEpisodeHlsSync(target.seasonId, target.episodeId, target.hlsUrl);
      }
    }
  };

  const scheduleHlsSyncForNewOrChangedEpisodes = (
    previousComparables: Map<string, string>,
    nextForm: SeriesFormState,
  ) => {
    const changedTargets = collectEpisodeHlsSyncTargetsForComparableChange(
      nextForm,
      previousComparables,
    );
    const targets = filterEpisodeHlsSyncTargetsForInitialScan(nextForm, changedTargets);

    episodeHlsComparableMapRef.current = buildEpisodeHlsComparableMap(nextForm);
    lastHlsFingerprintRef.current = buildHlsSyncFingerprint(nextForm);
    hlsAutoSyncBootstrappedRef.current = true;

    if (targets.length > 0) {
      void scheduleEpisodeHlsSyncForForm(nextForm, { targets });
    }
  };

  const scheduleEpisodeHlsSyncAfterFormChange = (
    previousComparables: Map<string, string>,
    nextForm: SeriesFormState,
  ) => {
    if (mode === "create") {
      const allTargets = collectEpisodeHlsSyncTargets(nextForm);
      const targets = filterEpisodeHlsSyncTargetsForInitialScan(nextForm, allTargets);

      episodeHlsComparableMapRef.current = buildEpisodeHlsComparableMap(nextForm);
      lastHlsFingerprintRef.current = buildHlsSyncFingerprint(nextForm);
      hlsAutoSyncBootstrappedRef.current = true;

      if (targets.length > 0) {
        void scheduleEpisodeHlsSyncForForm(nextForm, { targets });
      }

      return;
    }

    scheduleHlsSyncForNewOrChangedEpisodes(previousComparables, nextForm);
  };

  scheduleEpisodeHlsSyncAfterFormChangeRef.current = scheduleEpisodeHlsSyncAfterFormChange;

  useEffect(() => {
    if (mode !== "create" || loading) {
      return;
    }

    if (formRef.current.playback_protocol !== "hls") {
      return;
    }

    if (!hlsSyncFingerprint || hlsSyncFingerprint === lastHlsFingerprintRef.current) {
      return;
    }

    lastHlsFingerprintRef.current = hlsSyncFingerprint;

    const timer = window.setTimeout(() => {
      const snapshot = formRef.current;
      const previousComparables = episodeHlsComparableMapRef.current;
      const allTargets = collectEpisodeHlsSyncTargets(snapshot);
      const targets = hlsAutoSyncBootstrappedRef.current
        ? collectEpisodeHlsSyncTargetsForComparableChange(snapshot, previousComparables)
        : filterEpisodeHlsSyncTargetsForInitialScan(snapshot, allTargets);

      episodeHlsComparableMapRef.current = buildEpisodeHlsComparableMap(snapshot);
      hlsAutoSyncBootstrappedRef.current = true;

      if (targets.length === 0) {
        return;
      }

      void scheduleEpisodeHlsSyncForForm(snapshot, { targets });
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hlsSyncFingerprint, loading, mode]);

  const cascadeSeriesHlsDown = (raw: string) => {
    const parsed = parseHlsPackagePath(raw);
    const nextSeriesBase = parsed ? parsed.seriesBase : normalizeHlsBaseUrl(raw);
    let nextFormSnapshot: SeriesFormState | null = null;

    if (!nextSeriesBase) {
      lastCommittedSeriesHlsBaseRef.current = "";
      setSeriesHlsSyncMessage("");
      return;
    }

    setForm((current) => {
      const nextForm: SeriesFormState = {
        ...current,
        hls_base_url: nextSeriesBase,
      };

      nextFormSnapshot = nextForm;
      return nextForm;
    });

    lastCommittedSeriesHlsBaseRef.current = nextSeriesBase;
    const savedForm = nextFormSnapshot as SeriesFormState | null;

    if (!savedForm) {
      return;
    }

    setSeriesHlsSyncMessage(
      "ریشه HLS ثبت شد. برای پیدا کردن مسیر قسمت‌های جدید، پردازش HLS را بزنید.",
    );
  };

  const cascadeSeasonHlsDown = (seasonId: string, raw: string) => {
    const parsed = parseHlsPackagePath(raw);
    const nextSeasonBase = parsed?.seasonBase || normalizeHlsBaseUrl(raw);

    if (!nextSeasonBase) {
      return;
    }

    setForm((current) => ({
      ...current,
      hls_base_url:
        parsed?.seriesBase && !normalizeHlsBaseUrl(current.hls_base_url)
          ? parsed.seriesBase
          : current.hls_base_url,
      seasons: current.seasons.map((season) =>
        season.id === seasonId ? { ...season, hls_base_url: nextSeasonBase } : season,
      ),
    }));
  };

  const handleEpisodeHlsChange = (seasonId: string, episodeId: string, value: string) => {
    const parsed = parseHlsPackagePath(value);
    const touchedForSync: Array<{ episodeId: string; hlsUrl: string }> = [];

    setForm((current) => {
      const previousSeriesBase = normalizeHlsBaseUrl(current.hls_base_url);
      let nextSeriesBase = previousSeriesBase;

      if (
        parsed?.seriesBase &&
        shouldCascadeReplaceBase(current.hls_base_url, previousSeriesBase, parsed.seriesBase)
      ) {
        nextSeriesBase = parsed.seriesBase;
      }

      const seasons = current.seasons.map((season) => {
        if (season.id !== seasonId) {
          return season;
        }

        const previousSeasonDerived = deriveSeasonHlsBase(
          previousSeriesBase,
          season.season_number,
        );
        const nextSeasonBase =
          parsed?.seasonBase && shouldCascadeReplaceBase(
            season.hls_base_url,
            previousSeasonDerived,
            parsed.seasonBase,
          )
            ? parsed.seasonBase
            : season.hls_base_url;

        const episodes = season.episodes.map((episode) => {
          if (episode.id !== episodeId) {
            return episode;
          }

          const nextEpisodeHls = parsed?.episodeMaster || value.trim();

          if (nextEpisodeHls) {
            touchedForSync.push({ episodeId: episode.id, hlsUrl: nextEpisodeHls });
          }

          return {
            ...episode,
            hls_url: nextEpisodeHls,
            hls_verified:
              nextEpisodeHls === episode.hls_url ? episode.hls_verified : false,
          };
        });

        return {
          ...season,
          hls_base_url: nextSeasonBase,
          episodes,
        };
      });

      return {
        ...current,
        hls_base_url: nextSeriesBase,
        seasons,
      };
    });

    const episode = form.seasons
      .find((season) => season.id === seasonId)
      ?.episodes.find((item) => item.id === episodeId);
    const hlsForSync = toMasterPlaylistUrl(
      touchedForSync[0]?.hlsUrl ||
        parsed?.episodeMaster ||
        value.trim() ||
        episode?.hls_url ||
        "",
    );

    if (parsed?.seriesBase) {
      lastCommittedSeriesHlsBaseRef.current = normalizeHlsBaseUrl(parsed.seriesBase);
    }

    if (hlsForSync) {
      delete lastSyncedEpisodeHlsRef.current[seasonEpisodeKey(seasonId, episodeId)];
      scheduleEpisodeHlsSync(seasonId, episodeId, hlsForSync);
    }
  };

  const handleSeriesHlsBaseChange = (raw: string) => {
    setForm((current) => ({
      ...current,
      hls_base_url: raw,
    }));
    setSeriesHlsCascadePending(raw.trim().length >= 4);

    if (seriesHlsCascadeTimerRef.current) {
      window.clearTimeout(seriesHlsCascadeTimerRef.current);
    }

    seriesHlsCascadeTimerRef.current = window.setTimeout(() => {
      seriesHlsCascadeTimerRef.current = null;

      if (raw.trim().length < 4) {
        setSeriesHlsCascadePending(false);
        return;
      }

      cascadeSeriesHlsDown(raw);
      setSeriesHlsCascadePending(false);
    }, 550);
  };

  const handleSeasonHlsBaseChange = (seasonId: string, raw: string) => {
    setForm((current) => ({
      ...current,
      seasons: current.seasons.map((season) =>
        season.id === seasonId ? { ...season, hls_base_url: raw } : season,
      ),
    }));
    setSeasonHlsCascadePendingKeys((current) => {
      const next = { ...current };

      if (raw.trim().length >= 4) {
        next[seasonId] = true;
      } else {
        delete next[seasonId];
      }

      return next;
    });

    if (seasonHlsCascadeTimersRef.current[seasonId]) {
      window.clearTimeout(seasonHlsCascadeTimersRef.current[seasonId]);
    }

    seasonHlsCascadeTimersRef.current[seasonId] = window.setTimeout(() => {
      delete seasonHlsCascadeTimersRef.current[seasonId];

      if (raw.trim().length < 4) {
        setSeasonHlsCascadePendingKeys((current) => {
          if (!(seasonId in current)) {
            return current;
          }

          const next = { ...current };
          delete next[seasonId];
          return next;
        });
        return;
      }

      cascadeSeasonHlsDown(seasonId, raw);
      setSeasonHlsCascadePendingKeys((current) => {
        if (!(seasonId in current)) {
          return current;
        }

        const next = { ...current };
        delete next[seasonId];
        return next;
      });
    }, 550);
  };

  const setEpisodeSourceMethod = (
    seasonId: string,
    episodeId: string,
    method: "hls" | "url",
  ) => {
    setForm((current) => ({
      ...current,
      seasons: current.seasons.map((season) => {
        if (season.id !== seasonId) {
          return season;
        }

        return {
          ...season,
          episodes: season.episodes.map((episode) => {
            if (episode.id !== episodeId) {
              return episode;
            }

            if (method === "url") {
              return {
                ...episode,
                source_method: "url",
              };
            }

            const verifiedHls = episode.hls_verified ? episode.hls_url.trim() : "";

            return {
              ...episode,
              source_method: "hls",
              hls_url: verifiedHls,
              hls_verified: Boolean(verifiedHls),
            };
          }),
        };
      }),
    }));
  };

  const addSeason = () => {
    const nextSeasonNumber = getNextSeasonNumber(formRef.current.seasons);
    const protocol = formRef.current.playback_protocol || "hls";
    const nextSeason = createSeasonDraft(nextSeasonNumber, protocol);

    const nextFormSnapshot: SeriesFormState = {
      ...formRef.current,
      seasons: [...formRef.current.seasons, nextSeason],
    };

    setForm(nextFormSnapshot);
    setExpandedSeasonIds((current) => [...current, nextSeason.id]);

    void syncTmdbSeason(
      nextSeason.season_number,
      nextFormSnapshot,
      `فصل ${nextSeason.season_number} از TMDb همگام‌سازی شد.`,
      { fullSeasonResync: true },
    );
  };

  const removeSeason = (seasonId: string) => {
    setForm((current) => {
      const removedSeason = current.seasons.find((season) => season.id === seasonId);
      const seasonNumber = Number(removedSeason?.season_number) || 0;
      const nextExcludedSeasonNumbers =
        seasonNumber > 0 &&
        !current.tmdb_excluded_season_numbers.includes(seasonNumber)
          ? [...current.tmdb_excluded_season_numbers, seasonNumber]
          : current.tmdb_excluded_season_numbers;
      const nextExcludedEpisodes = current.tmdb_excluded_episodes.filter(
        (row) => row.season_number !== seasonNumber,
      );

      return {
        ...current,
        tmdb_excluded_season_numbers: nextExcludedSeasonNumbers,
        tmdb_excluded_episodes: nextExcludedEpisodes,
        seasons: current.seasons.filter((season) => season.id !== seasonId),
      };
    });
    setExpandedSeasonIds((current) => current.filter((id) => id !== seasonId));
    setExpandedEpisodeKeys((current) =>
      current.filter((key) => !key.startsWith(`${seasonId}:`)),
    );
  };

  const addEpisode = (seasonId: string) => {
    const targetSeason = formRef.current.seasons.find((season) => season.id === seasonId);

    if (!targetSeason) {
      return;
    }

    const protocol = formRef.current.playback_protocol || "hls";
    const createdEpisode = createEpisodeDraft(
      getNextEpisodeNumber(targetSeason.episodes),
      protocol,
    );

    const nextFormSnapshot: SeriesFormState = {
      ...formRef.current,
      seasons: formRef.current.seasons.map((season) =>
        season.id !== seasonId
          ? season
          : {
              ...season,
              episodes: [...season.episodes, createdEpisode],
            },
      ),
    };

    setForm(nextFormSnapshot);
    setExpandedSeasonIds((current) =>
      current.includes(seasonId) ? current : [...current, seasonId],
    );
    setExpandedEpisodeKeys((current) => [
      ...current,
      seasonEpisodeKey(seasonId, createdEpisode.id),
    ]);

    void syncTmdbSeason(
      targetSeason.season_number,
      nextFormSnapshot,
      `قسمت ${createdEpisode.episode_number} فصل ${targetSeason.season_number} از TMDb همگام‌سازی شد.`,
      {
        importEpisodeNumbers: [Number(createdEpisode.episode_number)],
      },
    );
  };

  const removeEpisode = (seasonId: string, episodeId: string) => {
    setForm((current) => {
      const season = current.seasons.find((item) => item.id === seasonId);
      const episode = season?.episodes.find((item) => item.id === episodeId);
      const seasonNumber = Number(season?.season_number) || 0;
      const episodeNumber = Number(episode?.episode_number) || 0;
      const alreadyExcluded = current.tmdb_excluded_episodes.some(
        (row) =>
          row.season_number === seasonNumber && row.episode_number === episodeNumber,
      );
      const nextExcludedEpisodes =
        seasonNumber > 0 &&
        episodeNumber > 0 &&
        !alreadyExcluded
          ? [
              ...current.tmdb_excluded_episodes,
              { season_number: seasonNumber, episode_number: episodeNumber },
            ]
          : current.tmdb_excluded_episodes;

      return {
        ...current,
        tmdb_excluded_episodes: nextExcludedEpisodes,
        seasons: current.seasons.map((item) =>
          item.id === seasonId
            ? {
                ...item,
                episodes: item.episodes.filter((row) => row.id !== episodeId),
              }
            : item,
        ),
      };
    });
    setExpandedEpisodeKeys((current) =>
      current.filter((key) => key !== seasonEpisodeKey(seasonId, episodeId)),
    );
  };

  const handleManualTmdbSync = async () => {
    const tmdbCode = normalizeTmdbCodeInput(form.tmdb_query);
    if (!tmdbCode) {
      setError("کد TMDB را وارد کنید.");
      return;
    }
    setSearchingTmdb(true);
    await fetchAndApplyTmdb(
      tmdbCode,
      "اطلاعات سریال و فصل‌ها از TMDB روی فرم اعمال شد.",
      undefined,
      { appendMissing: true },
    );
    setSearchingTmdb(false);
  };

  const savePublishStatusOnly = async () => {
    if (!seriesId) {
      return;
    }

    if (form.publish_status === "scheduled" && !form.scheduled_for.trim()) {
      setError("برای انتشار زمان بندی شده، تاریخ انتشار را وارد کن.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await adminSeriesService.updatePublishStatus(seriesId, {
        publish_status: form.publish_status,
        scheduled_for:
          form.publish_status === "scheduled" ? form.scheduled_for || null : null,
      });

      if (!(response.success && response.data)) {
        setError(response.message || "ذخیره وضعیت انتشار انجام نشد.");
        return;
      }

      const savedSeries = response.data.series;
      setSeries(savedSeries);
      setForm((current) => ({
        ...current,
        publish_status: savedSeries.publish_status || current.publish_status,
        scheduled_for: apiDateTimeToInputValue(savedSeries.scheduled_for),
      }));

      const savedPublishStatus = savedSeries.publish_status || form.publish_status;
      setPublishOutcomeStatus(savedPublishStatus);
      setPublishOutcomeOpen(true);
      setActiveTab("publish");
      pendingNavigationRef.current = "/admin/content-management/series";
      await Promise.all([
        revalidateAdminSeriesList(),
        revalidatePublicSeriesPages(savedSeries.slug, series?.slug, form.slug),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ذخیره وضعیت انتشار انجام نشد.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishOutcomeClose = () => {
    setPublishOutcomeOpen(false);
    const nextPath = pendingNavigationRef.current;
    pendingNavigationRef.current = null;

    if (nextPath) {
      void Promise.all([
        revalidateAdminSeriesList(),
        revalidatePublicSeriesPages(series?.slug, form.slug),
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

  const saveEpisodeOnly = async (seasonId: string, episodeId: string) => {
    if (!seriesId) {
      setError("برای ذخیره قسمت، ابتدا اطلاعات اصلی سریال را یک‌بار ذخیره کنید.");
      setActiveTab("identity");
      return;
    }

    const season = form.seasons.find((item) => item.id === seasonId);
    const episode = season?.episodes.find((item) => item.id === episodeId);

    if (!season || !episode) {
      return;
    }

    if (!season.season_number.trim()) {
      setError("شماره فصل را وارد کنید.");
      return;
    }

    if (!episode.episode_number.trim()) {
      setError("شماره قسمت را وارد کنید.");
      return;
    }

    flushEpisodeHlsBatchSync();

    const snapshot = formRef.current;
    const snapshotSeason = snapshot.seasons.find((item) => item.id === seasonId);
    const snapshotEpisode = snapshotSeason?.episodes.find((item) => item.id === episodeId);

    if (!snapshotSeason || !snapshotEpisode) {
      return;
    }

    const episodeKey = seasonEpisodeKey(seasonId, episodeId);

    setEpisodeSavingKeys((current) => ({ ...current, [episodeKey]: true }));
    setEpisodeSaveFeedback((current) => ({ ...current, [episodeKey]: "" }));
    setError("");

    try {
      const payload = buildEpisodeUpsertPayload(
        snapshotEpisode,
        snapshotSeason,
        snapshot,
      );
      const response = await adminSeriesService.upsertEpisode(
        seriesId,
        Number(snapshotSeason.season_number),
        Number(snapshotEpisode.episode_number),
        payload,
      );

      if (!(response.success && response.data?.episode)) {
        setEpisodeSaveFeedback((current) => ({
          ...current,
          [episodeKey]: response.message || "ذخیره قسمت انجام نشد.",
        }));
        return;
      }

      const savedEpisode = response.data.episode;
      const mergedEpisode = {
        ...snapshotEpisode,
        ...mergeSavedEpisodeIntoDraft(snapshotEpisode, savedEpisode),
      };

      updateEpisode(seasonId, episodeId, mergeSavedEpisodeIntoDraft(snapshotEpisode, savedEpisode));
      setEpisodeSavedFingerprints((current) => ({
        ...current,
        [episodeKey]: episodeDraftFingerprint(mergedEpisode),
      }));

      if (response.data.series) {
        setSeries((current) =>
          current ? { ...current, ...response.data!.series } : response.data!.series,
        );
      }

      setEpisodeSaveFeedback((current) => ({
        ...current,
        [episodeKey]: "ذخیره شد",
      }));

      void Promise.all([
        revalidateAdminSeriesList(),
        revalidatePublicSeriesPages(series?.slug, form.slug),
      ]);
    } catch (err) {
      setEpisodeSaveFeedback((current) => ({
        ...current,
        [episodeKey]:
          err instanceof Error ? err.message : "ذخیره قسمت انجام نشد.",
      }));
    } finally {
      setEpisodeSavingKeys((current) => {
        const next = { ...current };
        delete next[episodeKey];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    if (entryMode === "tmdb" && !form.tmdb_query.trim()) {
      setError("ابتدا کد TMDb سریال را وارد کن.");
      setActiveTab("identity");
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
      setActiveTab("identity");
      return;
    }

    if (!form.title.trim()) {
      setError("عنوان سریال ضروری است.");
      setActiveTab("identity");
      return;
    }

    if (entryMode === "tmdb" && !form.age_rating.trim()) {
      setError("درجه سنی اجباری است.");
      setActiveTab("identity");
      return;
    }

    if (entryMode === "manual") {
      const identityIssues = validateSeriesIdentityTab(
        form,
        buildSlug,
        ageRatingValues,
        entryMode,
      );
      if (identityIssues.length > 0) {
        setActiveTab("identity");
        applyTabFieldIssues(identityIssues);
        return;
      }

      const catalogIssues = validateSeriesCatalogTab(form, entryMode);
      if (catalogIssues.length > 0) {
        setActiveTab("catalog");
        applyTabFieldIssues(catalogIssues);
        return;
      }
    }

    if (!isSeasonsTabComplete) {
      setError(
        isManualMode
          ? "اگر فصل اضافه کرده‌ای، شماره فصل و قسمت را کامل کن."
          : "شماره فصل و شماره قسمت را کامل کن.",
      );
      setActiveTab("seasons");
      return;
    }

    if (form.publish_status === "scheduled" && !form.scheduled_for.trim()) {
      setError("برای انتشار زمان بندی شده، تاریخ انتشار را وارد کن.");
      setActiveTab("publish");
      return;
    }

    if (
      mode === "edit" &&
      seriesId &&
      activeTab === "publish" &&
      seriesFormBodyFingerprint(form) === seriesFormBodyFingerprintRef.current
    ) {
      await savePublishStatusOnly();
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      setSubmitStep("۱/۳ — ذخیره متادیتا و فصل‌ها...");
      console.time("series:submit");
      const payload = formToPayload(form, taxonomyCountries, entryMode);
      const response =
        mode === "edit" && seriesId
          ? await adminSeriesService.update(seriesId, payload)
          : await adminSeriesService.create(payload);
      console.timeEnd("series:submit");

      if (!(response.success && response.data?.series)) {
        setError(response.message || "ذخیره سریال انجام نشد.");
        return;
      }

      const savedSeries = response.data.series;
      setSeries(savedSeries);

      const processedPoster =
        toManagedImagePublicPath(savedSeries.poster_image?.original) ||
        toManagedImagePublicPath(savedSeries.poster_url);
      const processedBackdrop =
        toManagedImagePublicPath(savedSeries.backdrop_image?.original) ||
        toManagedImagePublicPath(savedSeries.backdrop_url);

      if (processedPoster || processedBackdrop) {
        setForm((current) => ({
          ...current,
          ...(processedPoster ? { poster_url: processedPoster } : {}),
          ...(processedBackdrop ? { backdrop_url: processedBackdrop } : {}),
        }));
      }

      // Revalidate in background — keep the form unlock immediate after API save.
      void Promise.all([
        revalidateAdminSeriesList(),
        revalidatePublicSeriesPages(savedSeries.slug, series?.slug, form.slug),
      ]);

      // Always return to the list immediately (same as movies). Heavy work stays
      // in the queue; do not wait on a modal or pipeline status before navigating.
      if (mode === "create") {
        resetCreateEditorState();
      }
      router.push("/admin/content-management/series");
      if (mode === "edit") {
        router.refresh();
      }
      return;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ذخیره سریال انجام نشد.",
      );
    } finally {
      setSubmitting(false);
      setSubmitStep(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
        <div className="h-[34rem] animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
      </div>
    );
  }

  const isTmdbOverviewLoading =
    searchingTmdb ||
    fetchingTmdb ||
    ingestingTmdbImages ||
    tmdbSyncState.phase === "fetching_overview";
  const isTmdbLoading = isTmdbOverviewLoading;
  const pendingTmdbSeasonRows = tmdbSyncState.seasonProgress.filter(
    (row) =>
      (row.status === "pending" || row.status === "loading") &&
      !form.seasons.some(
        (season) => Number(season.season_number) === row.season_number,
      ),
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_45%,rgba(56,189,248,0.14))] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
              TV Show workflow
            </span>
            <h2 className="mt-5 text-3xl font-black text-white md:text-5xl">
              {mode === "edit" ? "ویرایش سریال" : "افزودن سریال جدید"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/content-management/series"
              className="inline-flex whitespace-nowrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08]"
            >
              بازگشت به لیست
              <HiOutlineArrowLeft className="h-4 w-4" />
            </Link>
            {series?.slug ? (
              <Link
                href={`/series/${series.slug}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-5 py-3 text-sm font-semibold text-[#bfeaff] transition hover:bg-[#38bdf8]/16"
              >
                <HiOutlinePlay className="h-4 w-4" />
                مشاهده سریال
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

      {series?.pipeline_status === "failed" ? (
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
        <div className="rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-3 text-sm text-[#bfeaff]">
          {searchMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#bbf7d0]">
          {successMessage}
        </div>
      ) : null}

      <section
        className={`grid gap-6 ${activeTab === "publish" ? "grid-cols-1" : "xl:grid-cols-[1fr_360px]"}`}
      >
        <div ref={formTopRef} className="rounded-[32px] border border-white/10 bg-[#0b1720] p-5">
          <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                disabled={!canAccessTab(tab.key)}
                onClick={() => goToTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-[#f5c518] text-black"
                    : canAccessTab(tab.key)
                      ? "border border-white/10 bg-white/[0.04] text-[#d8e5ec] hover:bg-white/[0.08]"
                      : "cursor-not-allowed border border-white/5 bg-white/[0.02] text-[#607684] opacity-55"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "identity" ? (
            <div className="space-y-6">
              <SectionHeading
                icon={<HiOutlineFilm className="h-5 w-5" />}
                title="شناسه و اطلاعات اصلی"
              />
              <ContentEntryModeToggle
                value={entryMode}
                disabled={loading || submitting}
                onChange={(nextMode) => {
                  setEntryMode(nextMode);
                  setError("");
                  setTabFieldErrors({});
                  setSearchMessage("");
                  // قطع درخواست‌های در حال اجرای TMDB تا race باعث crash نشود
                  tmdbAbortControllerRef.current?.abort();
                  tmdbImageIngestAbortRef.current?.abort();
                  tmdbAbortControllerRef.current = null;
                  tmdbImageIngestAbortRef.current = null;
                  setSearchingTmdb(false);
                  setFetchingTmdb(false);
                  setIngestingTmdbImages(false);
                  setTmdbSyncState(initialTmdbSyncState);

                  if (nextMode === "manual") {
                    setForm((current) => ({
                      ...current,
                      tmdb_query: "",
                      tmdb_id: "",
                      // فصل‌ها را خالی نکن — فقط شناسه TMDB پاک شود
                    }));
                    setLastFetchedTmdbCode("");
                  }
                }}
              />
              {!isManualMode ? (
              <div className="rounded-[28px] border border-[#38bdf8]/18 bg-[#38bdf8]/[0.06] p-4 space-y-4">
                <TmdbTitleSearch
                  label="جستجوی عنوان سریال در TMDB"
                  placeholder="نام سریال را بنویسید…"
                  search={(query) => adminSeriesService.searchTmdb(query, "fa-IR")}
                  onSelect={(tmdbId) => {
                    void fetchAndApplyTmdb(String(tmdbId));
                  }}
                />

                <div className="grid gap-4 xl:grid-cols-[1.2fr_auto] xl:items-end">
                  <div className="whitespace-nowrap">
                    <TextField
                      label="کد TMDb"
                      value={form.tmdb_query}
                      onChange={handleTmdbCodeChange}
                      dir="ltr"
                      required
                      placeholder="124364"
                      fieldKey="tmdb_id"
                      error={tabFieldErrors.tmdb_id}
                    />
                    <TmdbIdAvailabilityHint
                      status={tmdbAvailability.status}
                      existing={tmdbAvailability.existing}
                      entityKind="series"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full border border-white/10 bg-[#071019] px-3 py-1.5 text-[#dbe7ee]">
                      TMDb ID: {form.tmdb_id || "هنوز ست نشده"}
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
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="عنوان فارسی/نمایشی" value={form.title} onChange={(value) => updateField("title", value)} required fieldKey="title" error={tabFieldErrors.title} />
                <TextField label="عنوان اصلی" value={form.original_title} onChange={(value) => updateField("original_title", value)} required={isManualMode} fieldKey="original_title" error={tabFieldErrors.original_title} />
                <div>
                  <TextField label="Slug" value={form.slug} onChange={(value) => updateField("slug", value)} dir="ltr" placeholder="show-slug" required={isManualMode} fieldKey="slug" error={tabFieldErrors.slug} />
                  <SlugAvailabilityHint
                    status={slugAvailability.status}
                    suggestion={slugAvailability.suggestion}
                    onApplySuggestion={(nextSlug) => updateField("slug", nextSlug)}
                  />
                </div>
                <TextField label="شبکه پخش" value={form.network} onChange={(value) => updateField("network", value)} placeholder="HBO, Netflix, ..." />
                <TextField label="امتیاز" value={form.rating} onChange={(value) => updateField("rating", value)} dir="ltr" placeholder="8.4" />
                <TextField label="تاریخ شروع پخش" type="date" value={form.first_air_date} onChange={(value) => updateField("first_air_date", value)} />
                <TextField label="تاریخ آخرین پخش" type="date" value={form.last_air_date} onChange={(value) => updateField("last_air_date", value)} />
                <TextField label="سال انتشار" value={form.release_year} onChange={(value) => updateField("release_year", value.replace(/[^\d]/g, ""))} dir="ltr" />
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">وضعیت تولید</span>
                  <AdminSelect value={form.status} onChange={(value) => updateField("status", value)} options={statusOptions} />
                </label>
                <FormFieldAnchor field="age_rating" error={tabFieldErrors.age_rating}>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">
                    درجه سنی <span className="text-[#f5c518]">*</span>
                  </span>
                  <AdminSelect
                    value={form.age_rating}
                    onChange={(value) => updateField("age_rating", value)}
                    options={ageRatingOptions}
                  />
                </label>
                </FormFieldAnchor>
              </div>

              <ContentWarningsField
                values={form.content_warnings}
                onChange={(values) =>
                  setForm((current) => ({ ...current, content_warnings: values }))
                }
              />

              <ExternalIdsSection
                imdbId={form.imdb_id}
                tvdbId={form.tvdb_id}
                homepageUrl={form.homepage_url}
                onImdbIdChange={(value) => updateField("imdb_id", value)}
                onTvdbIdChange={(value) => updateField("tvdb_id", value)}
                onHomepageUrlChange={(value) => updateField("homepage_url", value)}
              />

              <TextAreaField
                label={isManualMode ? "خلاصه داستان *" : "خلاصه داستان"}
                value={form.synopsis}
                onChange={(value) => updateField("synopsis", value)}
                rows={5}
                fieldKey="synopsis"
                error={tabFieldErrors.synopsis}
              />
              {form.synopsis_en.trim() ? (
                <p className="text-xs leading-6 text-[#8ea4b3]">
                  متن انگلیسی TMDB: {form.synopsis_en}
                </p>
              ) : null}

              <SectionHeading
                icon={<HiOutlineUserGroup className="h-5 w-5" />}
                title="طبقه بندی، عوامل و بازیگران"
              />
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
                  label="زبان ها"
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
                {(Object.keys(freeArrayFieldLabels) as SeriesFreeArrayField[]).map((field) => (
                  <ArrayItemsFieldCard
                    key={field}
                    label={freeArrayFieldLabels[field]}
                    placeholder="آیتم جدید"
                    items={form[field]}
                    draftValue={listDrafts[field]}
                    onDraftChange={(value) =>
                      setListDrafts((current) => ({
                        ...current,
                        [field]: value,
                      }))
                    }
                    onSubmit={() => handleArrayInputSubmit(field)}
                    onRemove={(value) => removeArrayItem(field, value)}
                  />
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">زبان اصلی</span>
                <AdminSelect
                  value={form.original_language}
                  onChange={(value) => updateField("original_language", value)}
                  options={originalLanguageSelectOptions}
                />
              </label>

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
                        key={`series-actor-${actorIndex}`}
                        className="group relative space-y-3 rounded-[22px] border border-white/10 bg-[#071019] p-3"
                      >
                        <p className="text-[11px] font-semibold text-[#8ea4b3]">
                          #{actorIndex + 1}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-[#8ea4b3]">
                            {actor.profile_url ? (
                              <PersonProfileImage
                                name={actor.name || "Actor"}
                                image={actor.profile_image}
                                src={actor.profile_url}
                                square
                                sizes="48px"
                                loading="lazy"
                              />
                            ) : (
                              (actor.name || "?").slice(0, 1)
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
                          entityType="series"
                          entityId={series?.id ?? seriesId ?? null}
                          imageRole="still"
                          uploadLabel="آپلود تصویر"
                          className={ltrInputClass}
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

          {activeTab === "catalog" ? (
            <div className="space-y-6">
              <SectionHeading
                icon={<HiOutlinePhotograph className="h-5 w-5" />}
                title="تصاویر"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldAnchor field="poster_url" error={tabFieldErrors.poster_url}>
                <AdminImageUrlField
                  label={isManualMode ? "پوستر *" : "پوستر"}
                  value={form.poster_url}
                  onChange={(value) => {
                    setForm((current) => ({
                      ...current,
                      poster_url: value,
                      ...(value.startsWith("/images/")
                        ? { poster_source_url: "" }
                        : {}),
                    }));
                  }}
                  entityType="series"
                  entityId={series?.id ?? seriesId ?? null}
                  imageRole="poster"
                  onUploaded={(result) => {
                    setSeries((current) =>
                      current
                        ? {
                            ...current,
                            poster_url: result.image_path,
                            poster_image: result.image ?? current.poster_image ?? null,
                          }
                        : current,
                    );
                  }}
                  className={ltrInputClass}
                />
                </FormFieldAnchor>
                <FormFieldAnchor field="backdrop_url" error={tabFieldErrors.backdrop_url}>
                <AdminImageUrlField
                  label={isManualMode ? "تصویر پس‌زمینه *" : "تصویر پس‌زمینه"}
                  value={form.backdrop_url}
                  onChange={(value) => {
                    setForm((current) => ({
                      ...current,
                      backdrop_url: value,
                      ...(value.startsWith("/images/")
                        ? { backdrop_source_url: "" }
                        : {}),
                    }));
                  }}
                  entityType="series"
                  entityId={series?.id ?? seriesId ?? null}
                  imageRole="backdrop"
                  onUploaded={(result) => {
                    setSeries((current) =>
                      current
                        ? {
                            ...current,
                            backdrop_url: result.image_path,
                            backdrop_image: result.image ?? current.backdrop_image ?? null,
                          }
                        : current,
                    );
                  }}
                  className={ltrInputClass}
                />
                </FormFieldAnchor>
                <TextField
                  label={isManualMode ? "Trailer URL (اختیاری)" : "Trailer URL"}
                  value={form.trailer_url}
                  onChange={(value) => updateField("trailer_url", value)}
                  dir="ltr"
                  className={ltrInputClass}
                />
                <TextField
                  label={isManualMode ? "Homepage URL (اختیاری)" : "Homepage URL"}
                  value={form.homepage_url}
                  onChange={(value) => updateField("homepage_url", value)}
                  dir="ltr"
                  className={ltrInputClass}
                />
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
            <div className="space-y-6">
              <SectionHeading
                icon={<HiOutlineGlobeAlt className="h-5 w-5" />}
                title="بهینه‌سازی موتور جستجو"
              />
              <SeoFieldsPanel
                title={form.title}
                synopsis={form.synopsis}
                slug={form.slug}
                metaTitle={form.meta_title}
                metaDescription={form.meta_description}
                onMetaTitleChange={(value) => updateField("meta_title", value)}
                onMetaDescriptionChange={(value) => updateField("meta_description", value)}
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

          {activeTab === "seasons" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeading
                  icon={<HiOutlineCollection className="h-5 w-5" />}
                  title="فصل ها و قسمت ها"
                />
                <button
                  type="button"
                  onClick={addSeason}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#e7ba12]"
                >
                  <HiOutlinePlus className="h-4 w-4" />
                  افزودن فصل
                </button>
              </div>

              <div className="rounded-[28px] border border-[#38bdf8]/20 bg-[#38bdf8]/[0.06] p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">پایه پخش HLS سریال</h3>
                      <p className="mt-2 text-xs leading-6 text-[#8ea4b3]">
                        ساختار hls-worker:{" "}
                        <span dir="ltr" className="text-[#d8e5ec]">
                          {"{series}/season-01/episode-01/master.m3u8"}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void routeSeriesPlaybackToConfirmedHls(formRef.current)}
                      disabled={hasEpisodeHlsSyncPending}
                      className="inline-flex items-center rounded-2xl border border-[#38bdf8]/40 bg-[#38bdf8]/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#38bdf8]/25 disabled:cursor-wait disabled:opacity-60"
                    >
                      پردازش HLS
                    </button>
                  </div>
                  <TextField
                    label="ریشه پکیج سریال"
                    value={form.hls_base_url}
                    onChange={handleSeriesHlsBaseChange}
                    placeholder="http://cinema.af/content2/beta/2026-05-12/Fallout"
                    dir="ltr"
                    className={ltrInputClass}
                  />
                  <EpisodeHlsSyncStatus message={seriesHlsSyncMessage} />
                  <p className="mt-2 text-xs leading-6 text-[#8ea4b3]">
                    روش پخش هر قسمت جداگانه است و قسمت‌های MP4 سر جایشان می‌مانند. با «پردازش
                    HLS» مسیر قسمت‌های جدید از ریشه پیدا می‌شود و فقط قسمتی لینک می‌گیرد که
                    پکیجش واقعاً خوانده شود.
                  </p>
                </div>

              <FormFieldAnchor field="seasons" error={tabFieldErrors.seasons}>
              <div className="space-y-5">
                {pendingTmdbSeasonRows.map((row) => (
                  <section
                    key={`tmdb-season-loading-${row.season_number}`}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3 px-4 py-5">
                      <span
                        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#f8d977]/25 border-t-[#f8d977]"
                        aria-hidden
                      />
                      <div>
                        <h3 className="text-lg font-black text-white">
                          فصل {row.season_number}
                        </h3>
                        <p className="mt-1 text-xs text-[#8ea4b3]">
                          در حال دریافت از TMDB…
                        </p>
                      </div>
                    </div>
                  </section>
                ))}

                {form.seasons.filter(Boolean).map((season, seasonIndex) => {
                  if (!season?.id) {
                    return null;
                  }
                  const seasonSyncStatus = tmdbSyncState.seasonProgress.find(
                    (row) => row.season_number === Number(season.season_number),
                  )?.status;
                  const isSeasonTmdbLoading = seasonSyncStatus === "loading";
                  const seasonContinuesWithHls =
                    Boolean(form.hls_base_url.trim()) ||
                    (season.episodes || []).some(
                      (episode) =>
                        episode?.source_method === "hls" && Boolean(episode.hls_url.trim()),
                    );
                  const seasonKeepsDirectVideo = (season.episodes || []).some((episode) =>
                    episode ? episodeKeepsExistingPlayback(episode) : false,
                  );

                  return (
                  <section
                    key={season.id}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
                  >
                    <div className="flex items-stretch border-b border-white/10">
                      <button
                        type="button"
                        onClick={() => toggleSeason(season.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-right transition hover:bg-white/[0.02]"
                      >
                        {expandedSeasonIds.includes(season.id) ? (
                          <HiOutlineChevronDown className="h-5 w-5 shrink-0 text-[#f8d977]" />
                        ) : (
                          <HiOutlineChevronRight className="h-5 w-5 shrink-0 text-[#f8d977]" />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-white">
                            فصل {season.season_number || seasonIndex + 1}
                          </h3>
                          <p className="mt-1 text-xs text-[#8ea4b3]">
                            {isSeasonTmdbLoading
                              ? "در حال دریافت از TMDB…"
                              : `${(season.episodes || []).length} قسمت`}
                          </p>
                          {seasonSyncStatus === "error" ? (
                            <p className="mt-1 text-xs text-[#fca5a5]">
                              {tmdbSyncState.seasonProgress.find(
                                (row) => row.season_number === Number(season.season_number),
                              )?.error || "دریافت این فصل از TMDB ناموفق بود."}
                            </p>
                          ) : null}
                        </div>
                      </button>
                      <div
                        className="flex flex-wrap items-center gap-2 px-4 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => addEpisode(season.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-3 py-2 text-xs text-[#7dd3fc] transition hover:bg-[#38bdf8]/15"
                        >
                          <HiOutlinePlus className="h-4 w-4" />
                          افزودن قسمت
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSeason(season.id)}
                          disabled={form.seasons.length === 1}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-3 py-2 text-xs text-[#fecdd3] transition hover:bg-[#fb7185]/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                          حذف فصل
                        </button>
                      </div>
                    </div>

                    {expandedSeasonIds.includes(season.id) ? (
                      <div className="space-y-5 p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <TextField label="شماره فصل" value={season.season_number} onChange={(value) => updateSeason(season.id, { season_number: value.replace(/[^\d]/g, "") })} dir="ltr" fieldKey={`season:${season.id}:number`} error={tabFieldErrors[`season:${season.id}:number`]} />
                          <TextField label="نام فصل" value={season.name} onChange={(value) => updateSeason(season.id, { name: value })} />
                          <TextField label="تاریخ پخش فصل" type="date" value={season.air_date} onChange={(value) => updateSeason(season.id, { air_date: value })} />
                          <TextField label="تعداد قسمت" value={season.episode_count} onChange={(value) => updateSeason(season.id, { episode_count: value.replace(/[^\d]/g, "") })} dir="ltr" />
                          <TextField label="Season image URL" value={season.poster_url} onChange={(value) => updateSeason(season.id, { poster_url: value })} dir="ltr" className={ltrInputClass} />
                          <div className="md:col-span-2">
                            <TextAreaField
                              label="توضیح فصل"
                              value={season.synopsis}
                              onChange={(value) =>
                                updateSeason(season.id, { synopsis: value })
                              }
                              rows={3}
                            />
                            {season.synopsis_en.trim() ? (
                              <p className="text-xs leading-6 text-[#8ea4b3]" dir="ltr">
                                متن انگلیسی TMDB: {season.synopsis_en}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 space-y-4">
                          {seasonContinuesWithHls ? (
                            <>
                              <TextField
                                label="پایه HLS فصل"
                                value={season.hls_base_url}
                                onChange={(value) => handleSeasonHlsBaseChange(season.id, value)}
                                placeholder="فقط اگر پکیج این فصل وجود دارد"
                                dir="ltr"
                                className={ltrInputClass}
                              />
                              <p className="text-xs leading-6 text-[#8ea4b3]">
                                {seasonKeepsDirectVideo
                                  ? "قسمت‌های MP4 این فصل حفظ می‌شوند. مسیر قسمت‌های جدید با پردازش HLS پیدا می‌شود."
                                  : "پایه فصل ذخیره می‌شود. مسیر قسمت‌های جدید با دکمه پردازش HLS پیدا می‌شود."}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs leading-6 text-[#8ea4b3]">
                              هر قسمت دکمه HLS یا ویدیو مستقیم دارد. برای قسمت‌های جدید، ریشه سریال را بگذارید و پردازش HLS را بزنید.
                            </p>
                          )}
                        </div>

                        <div
                          className="space-y-3"
                          data-form-field={`season:${season.id}:episodes`}
                        >
                          {tabFieldErrors[`season:${season.id}:episodes`] ? (
                            <p className="text-xs font-medium text-red-300" role="alert">
                              {tabFieldErrors[`season:${season.id}:episodes`]}
                            </p>
                          ) : null}
                            {(season.episodes || []).filter(Boolean).map((episode) => {
                            if (!episode?.id) {
                              return null;
                            }
                            const episodeKey = seasonEpisodeKey(season.id, episode.id);
                            const isEpisodeExpanded = expandedEpisodeKeys.includes(episodeKey);
                            const isEpisodeDirty =
                              episodeSavedFingerprints[episodeKey] === undefined ||
                              episodeSavedFingerprints[episodeKey] !==
                                episodeDraftFingerprint(episode);

                            return (
                              <div
                                key={episode.id}
                                className="overflow-hidden rounded-[24px] border border-white/10 bg-[#071019]"
                              >
                                <div className="flex items-stretch">
                                  <button
                                    type="button"
                                    onClick={() => toggleEpisode(season.id, episode.id)}
                                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-right transition hover:bg-white/[0.02]"
                                  >
                                    {isEpisodeExpanded ? (
                                      <HiOutlineChevronDown className="h-4 w-4 shrink-0 text-[#f8d977]" />
                                    ) : (
                                      <HiOutlineChevronRight className="h-4 w-4 shrink-0 text-[#f8d977]" />
                                    )}
                                    <div className="min-w-0">
                                      <h4 className="flex flex-wrap items-center gap-2 font-bold text-white">
                                        <span>
                                          {formatEpisodeHeading(
                                            episode.episode_number || "-",
                                            episode.title,
                                          )}
                                        </span>
                                        <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-[#d6e2e9]">
                                          {episode.source_method === "url" ||
                                          episode.source_method === "upload"
                                            ? "MP4"
                                            : episode.source_method === "embed"
                                              ? "Embed"
                                              : "HLS"}
                                        </span>
                                        {episodeHlsSyncMessage[episodeKey]?.includes("آماده نیست") ? (
                                          <span className="rounded-full border border-[#f5c518]/30 bg-[#f5c518]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f8d977]">
                                            منتشر نمی‌شود
                                          </span>
                                        ) : null}
                                        {isEpisodeDirty ? (
                                          <span className="rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7dd3fc]">
                                            ذخیره نشده
                                          </span>
                                        ) : null}
                                      </h4>
                                      <p className="mt-1 text-xs text-[#8ea4b3]">
                                        {episode.air_date
                                          ? formatGregorianDate(episode.air_date)
                                          : "تاریخ نامشخص"}{" "}
                                        •{" "}
                                        {episode.duration_minutes
                                          ? `${episode.duration_minutes} دقیقه`
                                          : "مدت نامشخص"}
                                      </p>
                                      <EpisodeHlsSyncStatus
                                        checking={episodeHlsSyncPending[episodeKey]}
                                        message={episodeHlsSyncMessage[episodeKey]}
                                      />
                                      {episodeSaveFeedback[episodeKey] ? (
                                        <p
                                          className={`mt-1 text-xs ${
                                            episodeSaveFeedback[episodeKey] === "ذخیره شد"
                                              ? "text-[#86efac]"
                                              : "text-[#fca5a5]"
                                          }`}
                                        >
                                          {episodeSaveFeedback[episodeKey]}
                                        </p>
                                      ) : null}
                                    </div>
                                  </button>
                                  <div
                                    className="flex items-center gap-2 px-4 py-3"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => void saveEpisodeOnly(season.id, episode.id)}
                                      disabled={
                                        Boolean(episodeSavingKeys[episodeKey]) || !seriesId
                                      }
                                      title={
                                        !seriesId
                                          ? "ابتدا سریال را یک‌بار ذخیره کنید"
                                          : undefined
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-2xl border border-[#f5c518]/35 bg-[#f5c518]/12 px-3 py-2 text-xs font-semibold text-[#f8d977] transition hover:bg-[#f5c518]/18 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <HiOutlineSave className="h-3.5 w-3.5" />
                                      {episodeSavingKeys[episodeKey]
                                        ? "در حال ذخیره…"
                                        : "ذخیره قسمت"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeEpisode(season.id, episode.id)}
                                      disabled={season.episodes.length === 1}
                                      className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-3 py-2 text-xs text-[#fecdd3] transition hover:bg-[#fb7185]/15 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      حذف قسمت
                                    </button>
                                  </div>
                                </div>

                                {isEpisodeExpanded ? (
                                  <div className="grid gap-4 border-t border-white/10 px-4 py-4 md:grid-cols-2">
                                    <TextField label="شماره قسمت" value={episode.episode_number} onChange={(value) => updateEpisode(season.id, episode.id, { episode_number: value.replace(/[^\d]/g, "") })} dir="ltr" fieldKey={`episode:${season.id}:${episode.id}:number`} error={tabFieldErrors[`episode:${season.id}:${episode.id}:number`]} />
                                    <TextField
                                      label="عنوان قسمت (اختیاری)"
                                      value={episode.title}
                                      onChange={(value) =>
                                        updateEpisode(season.id, episode.id, { title: value })
                                      }
                                    />
                                    <TextField label="تاریخ پخش" type="date" value={episode.air_date} onChange={(value) => updateEpisode(season.id, episode.id, { air_date: value })} />
                                    <TextField
                                      label="مدت قسمت (اختیاری)"
                                      value={episode.duration_minutes}
                                      onChange={(value) =>
                                        updateEpisode(season.id, episode.id, {
                                          duration_minutes: value.replace(/[^\d]/g, ""),
                                        })
                                      }
                                      dir="ltr"
                                    />
                                    <div className="md:col-span-2 space-y-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                                      <div className="flex flex-wrap gap-2">
                                        {(
                                          [
                                            { value: "hls" as const, label: "HLS" },
                                            { value: "url" as const, label: "ویدیو مستقیم MP4" },
                                          ] as const
                                        ).map((option) => {
                                          const selected =
                                            option.value === "hls"
                                              ? episode.source_method === "hls"
                                              : episode.source_method === "url" ||
                                                episode.source_method === "upload";

                                          return (
                                            <button
                                              key={option.value}
                                              type="button"
                                              onClick={() =>
                                                setEpisodeSourceMethod(
                                                  season.id,
                                                  episode.id,
                                                  option.value,
                                                )
                                              }
                                              className={`rounded-2xl border px-3 py-1.5 text-xs font-semibold transition ${
                                                selected
                                                  ? "border-[#f5c518]/45 bg-[#f5c518]/15 text-white"
                                                  : "border-white/10 bg-[#071019] text-[#c7d5de] hover:border-white/20"
                                              }`}
                                            >
                                              {option.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      {episode.source_method === "url" ||
                                      episode.source_method === "upload" ? (
                                        <TextField
                                          label="آدرس ویدیو مستقیم (MP4/MKV)"
                                          value={episode.video_url}
                                          onChange={(value) =>
                                            updateEpisode(season.id, episode.id, {
                                              video_url: value,
                                              source_method: "url",
                                            })
                                          }
                                          placeholder="https://cdn.example.com/episodes/s01e01.mkv"
                                          dir="ltr"
                                          className={ltrInputClass}
                                          fieldKey={`episode:${season.id}:${episode.id}:video_url`}
                                          error={
                                            tabFieldErrors[
                                              `episode:${season.id}:${episode.id}:video_url`
                                            ]
                                          }
                                        />
                                      ) : episode.source_method === "embed" ? (
                                        <TextField
                                          label="آدرس embed"
                                          value={episode.embed_url}
                                          onChange={(value) =>
                                            updateEpisode(season.id, episode.id, {
                                              embed_url: value,
                                              source_method: "embed",
                                            })
                                          }
                                          dir="ltr"
                                          className={ltrInputClass}
                                        />
                                      ) : (
                                        <>
                                          <TextField
                                            label="مسیر HLS"
                                            value={episode.hls_url}
                                            onChange={(value) =>
                                              handleEpisodeHlsChange(season.id, episode.id, value)
                                            }
                                            placeholder="پوشهٔ پکیج یا آدرس کامل master.m3u8"
                                            dir="ltr"
                                            className={ltrInputClass}
                                            fieldKey={`episode:${season.id}:${episode.id}:hls_url`}
                                            error={
                                              tabFieldErrors[
                                                `episode:${season.id}:${episode.id}:hls_url`
                                              ]
                                            }
                                          />
                                          <EpisodeHlsSyncStatus
                                            checking={episodeHlsSyncPending[episodeKey]}
                                            message={episodeHlsSyncMessage[episodeKey]}
                                          />
                                        </>
                                      )}

                                      <PlaybackSubtitleDubFields
                                        playbackProtocol={
                                          episode.source_method === "url" ||
                                          episode.source_method === "upload"
                                            ? "mp4"
                                            : "hls"
                                        }
                                        subtitleUrl={episode.subtitle_url}
                                        dubbedAudioUrl={episode.dubbed_audio_url}
                                        hasSubtitle={episode.has_subtitle}
                                        hasDubbed={episode.has_dubbed}
                                        ltrInputClass={ltrInputClass}
                                        onSubtitleUrlChange={(value) =>
                                          updateEpisode(season.id, episode.id, {
                                            subtitle_url: value,
                                          })
                                        }
                                        onDubbedAudioUrlChange={(value) =>
                                          updateEpisode(season.id, episode.id, {
                                            dubbed_audio_url: value,
                                          })
                                        }
                                        onHasSubtitleChange={(value) =>
                                          updateEpisode(season.id, episode.id, {
                                            has_subtitle: value,
                                          })
                                        }
                                        onHasDubbedChange={(value) =>
                                          updateEpisode(season.id, episode.id, {
                                            has_dubbed: value,
                                          })
                                        }
                                      />

                                      <EpisodeDownloadLinksEditor
                                        rows={episodeDownloadRowsFromMap(episode.download_links || {})}
                                        onChange={(rows) =>
                                          updateEpisode(season.id, episode.id, {
                                            download_links: episodeDownloadMapFromRows(rows),
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <AdminImageUrlField
                                        label="Background / Still image"
                                        value={episode.still_url}
                                        onChange={(value) =>
                                          updateEpisode(season.id, episode.id, {
                                            still_url: value,
                                          })
                                        }
                                        entityType="series"
                                        entityId={series?.id ?? seriesId ?? null}
                                        imageRole="still"
                                        className={ltrInputClass}
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <TextAreaField
                                        label="خلاصه قسمت"
                                        value={episode.synopsis}
                                        onChange={(value) =>
                                          updateEpisode(season.id, episode.id, {
                                            synopsis: value,
                                          })
                                        }
                                        rows={3}
                                      />
                                      {episode.synopsis_en.trim() ? (
                                        <p
                                          className="text-xs leading-6 text-[#8ea4b3] md:col-span-2"
                                          dir="ltr"
                                        >
                                          متن انگلیسی TMDB: {episode.synopsis_en}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </section>
                );
                })}
              </div>
              </FormFieldAnchor>

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
            <div className="space-y-6">
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
                  <AdminSelectField
                    label="انتخاب وضعیت"
                    value={form.publish_status}
                    onChange={(value) => {
                      const nextStatus = value as SeriesPublishStatus;
                      setForm((current) => ({
                        ...current,
                        publish_status: nextStatus,
                        scheduled_for:
                          nextStatus === "scheduled" ? current.scheduled_for : "",
                      }));
                    }}
                    options={publishStatusOptions}
                  />
                  {form.publish_status === "scheduled" ? (
                    <AdminScheduleDateTimePicker
                      label="زمان انتشار"
                      value={form.scheduled_for}
                      onChange={(value) => updateField("scheduled_for", value)}
                      minDateTime={toDateTimeInputValue(new Date())}
                    />
                  ) : null}
                </div>
              </div>

              <SectionHeading
                icon={<HiOutlineGlobeAlt className="h-5 w-5" />}
                title="انتشار"
              />

              <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      نمایش در اسلایدر صفحه اصلی
                    </span>
                    <span className="mt-1 block text-xs text-[#8ea4b3]">
                      این سریال در ابتدای اسلایدر HomeHero قرار می‌گیرد (حداکثر{" "}
                      {homeHeroSlider.max} مورد — فعال: {homeHeroSlider.current}).
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      if (checked && !form.is_featured && homeHeroSlider.remaining <= 0) {
                        setError(
                          `اسلایدر صفحه اصلی حداکثر ${homeHeroSlider.max} مورد می‌تواند داشته باشد. ابتدا یکی را غیرفعال کنید.`,
                        );
                        return;
                      }

                      setError("");
                      setForm((current) => ({
                        ...current,
                        is_featured: checked,
                      }));
                      setHomeHeroSlider((current) => {
                        if (checked && !form.is_featured) {
                          return {
                            ...current,
                            current: current.current + 1,
                            remaining: Math.max(0, current.remaining - 1),
                          };
                        }
                        if (!checked && form.is_featured) {
                          return {
                            ...current,
                            current: Math.max(0, current.current - 1),
                            remaining: current.remaining + 1,
                          };
                        }
                        return current;
                      });
                    }}
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
                    options={seriesCatalogVisibilityOptions}
                  />
                </label>
              </div>

              <details className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  تنظیمات DRM (اختیاری)
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm text-[#8ea4b3]">طرح DRM</span>
                    <select
                      value={form.drm_scheme}
                      onChange={(event) => updateField("drm_scheme", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    >
                      <option value="none">بدون DRM</option>
                      <option value="widevine">Widevine (Chrome / Android / Fire TV)</option>
                      <option value="playready">PlayReady (Edge / Tizen / webOS)</option>
                      <option value="fairplay">FairPlay (Safari / iOS)</option>
                    </select>
                  </label>

                  {form.drm_scheme !== "none" ? (
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm text-[#8ea4b3]">
                        آدرس سرور لایسنس DRM
                      </span>
                      <input
                        type="url"
                        dir="ltr"
                        value={form.drm_license_url}
                        onChange={(event) =>
                          updateField("drm_license_url", event.target.value)
                        }
                        placeholder="https://license.example.com/widevine"
                        className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                      />
                    </label>
                  ) : null}
                </div>
              </details>

              <SeriesFormStatusPanel
                fullWidth
                title={form.title}
                originalTitle={form.original_title}
                synopsis={form.synopsis}
                slug={`/${resolvedSlug}`}
                posterUrl={previewPosterUrl}
                backdropUrl={previewBackdropUrl}
                posterImage={previewPosterImage}
                backdropImage={previewBackdropImage}
                productionStatusLabel={productionStatusLabel}
                publishStatusLabel={publishStatusLabel}
                seasonsCount={form.seasons.length}
                episodesCount={totalEpisodes}
                genres={form.genres}
                tags={form.tags}
                scheduledFor={form.scheduled_for}
                publishStatus={form.publish_status}
                hasSubtitle={hasSubtitle}
                hasDubbed={hasDubbed}
              />

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
                {mode === "edit" && seriesId ? (
                  <button
                    type="button"
                    disabled={previewLoading}
                    onClick={() => {
                      void (async () => {
                        setPreviewLoading(true);
                        try {
                          const response = await adminSeriesService.getPreviewToken(seriesId);
                          const token = response.data?.token;
                          const slug = form.slug.trim();
                          if (response.success && token && slug) {
                            window.open(`/series/${slug}?preview=${token}`, "_blank");
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

              {mode === "edit" && seriesId ? (
                <ContentChangeHistoryPanel
                  entityLabel="سریال"
                  loadHistory={async (page = 1) => {
                    const response = await adminSeriesService.getHistory(seriesId, page);
                    if (response.success && response.data) {
                      return response.data;
                    }
                    return null;
                  }}
                />
              ) : null}

              <EditorPublishSubmitBar
                onSubmit={() => void handleSubmit()}
                disabled={!canSubmitForm || isSubmitBlockedByBackgroundProcessing}
                loading={submitting}
                label={submitButtonLabel}
                hint={
                  submitBlockedHint ||
                  (mode === "edit" &&
                  seriesFormBodyFingerprint(form) === seriesFormBodyFingerprintRef.current
                    ? "فقط وضعیت انتشار و زمان‌بندی ذخیره می‌شود (سریع)."
                    : "تمام اطلاعات سریال، فصل‌ها و وضعیت انتشار ذخیره می‌شود.")
                }
              />
            </div>
          ) : null}
        </div>

        <aside className={`space-y-5 ${activeTab === "publish" ? "hidden" : ""}`}>
          <section className="rounded-[28px] border border-white/10 bg-[#0b1720] p-5">
            <h3 className="text-lg font-black text-white">پیش‌نمایش سریع</h3>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
              {isTmdbLoading ? (
                <TmdbPreviewSkeleton className="rounded-none border-0" />
              ) : previewBackdropUrl ||
                previewBackdropFallbackUrl ||
                previewPosterUrl ||
                previewPosterFallbackUrl ? (
                <div className="relative h-[24rem] overflow-hidden">
                  {previewBackdropUrl || previewBackdropFallbackUrl || previewBackdropImage ? (
                    <div className="absolute inset-0">
                      <BackdropImage
                        title={form.title || "Series"}
                        image={previewBackdropImage}
                        src={previewBackdropUrl}
                        fallbackUrl={
                          previewBackdropFallbackUrl ||
                          form.backdrop_source_url.trim() ||
                          series?.metadata?.tmdb?.backdrop_source_url ||
                          series?.metadata?.tmdb?.backdrop_url ||
                          null
                        }
                        allowRemoteFallback
                        usage="detail-backdrop"
                      />
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,25,0.08),rgba(7,16,25,0.88)_62%,rgba(7,16,25,0.98))]" />
                  <div className="relative flex h-full flex-col justify-end p-4">
                    <div className="flex items-end gap-4">
                      <div className="h-36 w-24 overflow-hidden rounded-[20px] border border-white/10 bg-[#071019] shadow-[0_20px_40px_rgba(0,0,0,0.32)]">
                        {previewPosterUrl || previewPosterFallbackUrl || previewPosterImage ? (
                          <PosterImage
                            title={form.title || "Series"}
                            image={previewPosterImage}
                            src={previewPosterUrl}
                            fallbackUrl={
                              previewPosterFallbackUrl ||
                              form.poster_source_url.trim() ||
                              series?.metadata?.tmdb?.poster_source_url ||
                              series?.metadata?.tmdb?.poster_url ||
                              null
                            }
                            allowRemoteFallback
                            usage="detail-poster"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-[#8ea4b3]">
                            No poster
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xl font-black text-white">
                          {form.title || form.original_title || "عنوان سریال"}
                        </h4>
                        <p className="mt-2 line-clamp-4 text-xs leading-6 text-[#d6e2e9]">
                          {form.synopsis || "خلاصه‌ای ثبت نشده است."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-3 py-1 text-[#7dd3fc]">
                            {productionStatusLabel}
                          </span>
                          <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-[#f8d977]">
                            {publishStatusLabel}
                          </span>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[#dde7ed]">
                            {form.seasons.length} فصل
                          </span>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[#dde7ed]">
                            {totalEpisodes} قسمت
                          </span>
                          {form.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[#dde7ed]"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-[#8ea4b3]">
                  پیش نمایش سریع بعد از ثبت پوستر یا بک دراپ اینجا نمایش داده می شود.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="عنوان" value={form.title || "ثبت نشده"} />
              <SummaryRow label="Slug" value={`/${form.slug || buildSlug(form.original_title, form.title) || "series-slug"}`} ltr />
              <SummaryRow label="فصل ها" value={String(form.seasons.length)} />
              <SummaryRow label="قسمت ها" value={String(totalEpisodes)} />
              <SummaryRow label="وضعیت تولید" value={productionStatusLabel} />
              <SummaryRow label="انتشار" value={publishStatusLabel} />
              <SummaryRow label="ژانرها" value={form.genres.join("، ") || "ثبت نشده"} />
              <SummaryRow label="برچسب‌ها" value={form.tags.join("، ") || "ثبت نشده"} />
              <SummaryRow
                label="زمان انتشار"
                value={
                  form.publish_status === "scheduled" && form.scheduled_for
                    ? formatGregorianDateTime(form.scheduled_for)
                    : "ثبت نشده"
                }
                ltr={form.publish_status === "scheduled" && Boolean(form.scheduled_for)}
              />
            </div>
          </section>

          {series ? (
            <section className="rounded-[28px] border border-white/10 bg-[#0b1720] p-5">
              <h3 className="text-lg font-black text-white">شناسه ذخیره شده</h3>
              <p className="mt-3 text-sm text-[#8ea4b3]">ID: {series.id}</p>
              <p className="mt-2 break-all text-sm text-[#8ea4b3]">/{series.slug}</p>
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5c518]/12 text-[#f8d977]">
        {icon}
      </span>
      <h3 className="text-xl font-black text-white">{title}</h3>
    </div>
  );
}

function ArrayItemsFieldCard({
  label,
  items,
  draftValue,
  placeholder = "آیتم جدید",
  onDraftChange,
  onSubmit,
  onRemove,
}: {
  label: string;
  items: string[];
  draftValue: string;
  placeholder?: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onRemove: (value: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-[#8ea4b3]">{label}</p>

      <div className="mt-3 flex min-h-8 flex-wrap gap-2">
        {items.length ? (
          items.map((item, index) => (
            <span
              key={`${label}-${typeof item === "string" ? item : index}`}
              className="group relative inline-flex items-center rounded-full border border-white/10 bg-[#071019] px-3 py-1 text-[11px] text-[#dde7ed]"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#fb7185]/30 bg-[#0b1720] text-[#fecdd3] opacity-0 transition group-hover:opacity-100"
              >
                <HiOutlineX className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-[#7f94a1]">آیتمی ثبت نشده</span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-[#071019] px-3 py-2 text-xs text-white outline-none transition focus:border-[#f5c518]/45"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.08]"
        >
          <HiOutlinePlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EpisodeDownloadLinksEditor({
  rows,
  onChange,
}: {
  rows: EpisodeDownloadLinkRow[];
  onChange: (rows: EpisodeDownloadLinkRow[]) => void;
}) {
  const updateRow = (
    index: number,
    field: keyof Omit<EpisodeDownloadLinkRow, "id">,
    value: string,
  ) => {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  const addRow = () => {
    onChange([...rows, createEpisodeDownloadLinkRow("", "")]);
  };

  const removeRow = (index: number) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    onChange(nextRows.length ? nextRows : [createEpisodeDownloadLinkRow()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">
          لینک‌های دانلود <span className="font-normal text-[#8ea4b3]">(اختیاری)</span>
        </h4>
        <button
          type="button"
          onClick={addRow}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
        >
          افزودن لینک
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[24px] border border-white/10 bg-[#071019] p-4 md:grid-cols-[180px_1fr_auto]"
          >
            <div dir="ltr" className={`min-w-0 ${ltrLinkInputClass}`}>
              <AdminSelect
                value={row.quality}
                onChange={(value) => updateRow(index, "quality", value)}
                options={downloadQualityOptions}
                placeholder="انتخاب کیفیت"
              />
            </div>
            <input
              type="url"
              dir="ltr"
              value={row.url}
              onChange={(event) => updateRow(index, "url", event.target.value)}
              placeholder="https://cdn.example.com/episode-1080.mkv"
              className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrLinkInputClass}`}
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 px-4 py-3 text-xs font-semibold text-[#fecdd3] transition hover:bg-[#fb7185]/15"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
  required = false,
  disabled = false,
  className = "",
  fieldKey,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "rtl" | "ltr";
  required?: boolean;
  disabled?: boolean;
  className?: string;
  fieldKey?: string;
  error?: string;
}) {
  return (
    <label className="block" data-form-field={fieldKey}>
      <span className="mb-2 block text-sm text-[#8ea4b3]">
        {label}
        {required ? <span className="text-[#f5c518]"> *</span> : null}
      </span>
      <input
        type={type}
        dir={dir}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-2xl border bg-[#071019] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#607684] focus:border-[#f5c518]/45 disabled:cursor-not-allowed disabled:opacity-55 ${formFieldBorderClass(Boolean(error))} ${className}`}
      />
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  dir,
  fieldKey,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  fieldKey?: string;
  error?: string;
}) {
  return (
    <label className="block" data-form-field={fieldKey}>
      <span className="mb-2 block text-sm text-[#8ea4b3]">{label}</span>
      <textarea
        rows={rows}
        dir={dir}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border bg-[#071019] px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-[#607684] focus:border-[#f5c518]/45 ${formFieldBorderClass(Boolean(error))}`}
      />
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function AdminSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-[#8ea4b3]">{label}</span>
      <AdminSelect value={value} onChange={onChange} options={options} />
    </label>
  );
}

function SummaryRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-[#8ea4b3]">{label}</p>
      <p
        dir={ltr ? "ltr" : "rtl"}
        className={`mt-2 break-words font-semibold text-white ${ltr ? "text-left" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
