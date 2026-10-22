import { isAgeRatingSelected } from "../../../lib/person-name";
import { isProgressiveVideoUrl } from "../../../features/player/utils/format";
import type { SeasonDraft } from "../series/_lib/series-tmdb-sync";
import type { TabFieldIssue } from "./admin-form-tab-validation";
import type { ContentEntryMode } from "./content-entry-mode";

type SeriesIdentityValidationInput = {
  title: string;
  slug: string;
  original_title: string;
  synopsis: string;
  age_rating: string;
  tmdb_id: string;
  genres: string[];
  countries: string[];
  languages: string[];
};

type SeriesCatalogValidationInput = {
  poster_url: string;
  backdrop_url: string;
};

type SeriesSeasonsValidationInput = {
  seasons: SeasonDraft[];
  playback_protocol?: "hls" | "mp4";
  hls_base_url?: string;
};

export function resolveSeriesSlug(
  slug: string,
  originalTitle: string,
  title: string,
  tmdbId: string,
  buildSlug: (...candidates: Array<string | null | undefined>) => string,
) {
  return (
    slug.trim() ||
    buildSlug(originalTitle, title, tmdbId ? `series-${tmdbId}` : null)
  );
}

export function validateSeriesIdentityTab(
  form: SeriesIdentityValidationInput,
  buildSlug: (...candidates: Array<string | null | undefined>) => string,
  ageRatingValues: readonly string[],
  entryMode: ContentEntryMode = "tmdb",
): TabFieldIssue[] {
  const issues: TabFieldIssue[] = [];

  if (!form.title.trim()) {
    issues.push({ field: "title", message: "عنوان سریال را وارد کنید." });
  }

  if (entryMode === "manual") {
    if (!form.original_title.trim()) {
      issues.push({ field: "original_title", message: "عنوان اصلی را وارد کنید." });
    }

    if (!form.slug.trim()) {
      issues.push({ field: "slug", message: "slug را وارد کنید." });
    }

    if (!form.synopsis.trim()) {
      issues.push({ field: "synopsis", message: "خلاصه داستان را وارد کنید." });
    }

    if (!isAgeRatingSelected(form.age_rating, ageRatingValues)) {
      issues.push({ field: "age_rating", message: "درجه سنی را انتخاب کنید." });
    }

    if (form.genres.length === 0) {
      issues.push({ field: "genres", message: "حداقل یک ژانر انتخاب کنید." });
    }

    if (form.countries.length === 0) {
      issues.push({ field: "countries", message: "حداقل یک کشور انتخاب کنید." });
    }

    if (form.languages.length === 0) {
      issues.push({ field: "languages", message: "حداقل یک زبان انتخاب کنید." });
    }

    return issues;
  }

  if (
    !resolveSeriesSlug(form.slug, form.original_title, form.title, form.tmdb_id, buildSlug)
  ) {
    issues.push({ field: "slug", message: "slug باید مشخص باشد." });
  }

  if (!form.tmdb_id.trim()) {
    issues.push({ field: "tmdb_id", message: "کد TMDb را وارد کنید." });
  }

  if (!form.synopsis.trim()) {
    issues.push({ field: "synopsis", message: "خلاصه داستان را وارد کنید." });
  }

  if (!isAgeRatingSelected(form.age_rating, ageRatingValues)) {
    issues.push({ field: "age_rating", message: "درجه سنی را انتخاب کنید." });
  }

  return issues;
}

export function validateSeriesCatalogTab(
  form: SeriesCatalogValidationInput,
  entryMode: ContentEntryMode = "tmdb",
): TabFieldIssue[] {
  const issues: TabFieldIssue[] = [];

  if (entryMode !== "manual") {
    return issues;
  }

  if (!form.poster_url.trim()) {
    issues.push({ field: "poster_url", message: "پوستر را وارد کنید." });
  }

  if (!form.backdrop_url.trim()) {
    issues.push({ field: "backdrop_url", message: "تصویر پس‌زمینه را وارد کنید." });
  }

  return issues;
}

export function validateSeriesSeasonsTab(
  form: SeriesSeasonsValidationInput,
  entryMode: ContentEntryMode = "tmdb",
): TabFieldIssue[] {
  const issues: TabFieldIssue[] = [];

  if (form.seasons.length === 0) {
    if (entryMode === "manual") {
      return issues;
    }

    issues.push({ field: "seasons", message: "حداقل یک فصل اضافه کنید." });
    return issues;
  }

  for (const season of form.seasons) {
    if (!season.season_number.trim()) {
      issues.push({
        field: `season:${season.id}:number`,
        message: `شماره فصل ${season.name || "بدون نام"} را وارد کنید.`,
      });
    }

    if (season.episodes.length === 0) {
      issues.push({
        field: `season:${season.id}:episodes`,
        message: `برای فصل ${season.season_number || "؟"} حداقل یک قسمت اضافه کنید.`,
      });
      continue;
    }

    for (const episode of season.episodes) {
      if (!episode.episode_number.trim()) {
        issues.push({
          field: `episode:${season.id}:${episode.id}:number`,
          message: `شماره قسمت در فصل ${season.season_number || "؟"} را وارد کنید.`,
        });
      }

      // Progressive episode URLs are optional; only validate format when this episode is direct video.
      const episodeIsDirectVideo =
        episode.source_method === "url" || episode.source_method === "upload";

      if (
        episodeIsDirectVideo &&
        (episode.video_url || "").trim() &&
        !isProgressiveVideoUrl(episode.video_url)
      ) {
        issues.push({
          field: `episode:${season.id}:${episode.id}:video_url`,
          message: `آدرس ویدیو مستقیم (MP4/MKV) قسمت ${episode.episode_number || "؟"} معتبر نیست.`,
        });
      }
    }
  }

  return issues;
}

export function validateSeriesTab(
  tab: "identity" | "catalog" | "seo" | "seasons" | "publish",
  form: SeriesIdentityValidationInput &
    SeriesCatalogValidationInput &
    SeriesSeasonsValidationInput,
  buildSlug: (...candidates: Array<string | null | undefined>) => string,
  ageRatingValues: readonly string[],
  entryMode: ContentEntryMode = "tmdb",
): TabFieldIssue[] {
  if (tab === "identity") {
    return validateSeriesIdentityTab(form, buildSlug, ageRatingValues, entryMode);
  }

  if (tab === "catalog") {
    return validateSeriesCatalogTab(form, entryMode);
  }

  if (tab === "seasons") {
    return validateSeriesSeasonsTab(form, entryMode);
  }

  return [];
}

export function parseSeriesSeasonFieldKey(field: string): string | null {
  const match = field.match(/^season:([^:]+):/);

  return match?.[1] ?? null;
}

export function parseSeriesEpisodeFieldKey(
  field: string,
): { seasonId: string; episodeId: string } | null {
  const match = field.match(/^episode:([^:]+):([^:]+):/);

  if (!match) {
    return null;
  }

  return { seasonId: match[1], episodeId: match[2] };
}
