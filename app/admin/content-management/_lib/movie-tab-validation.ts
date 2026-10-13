import { isProgressiveVideoUrl } from "../../../features/player/utils/format";
import type { TabFieldIssue } from "./admin-form-tab-validation";
import type { ContentEntryMode } from "./content-entry-mode";

function hasValidActors(actors: Array<{ name: string | null }>): boolean {
  return actors.some((actor) => (actor.name || "").trim() !== "");
}

type MovieDetailsValidationInput = {
  tmdb_id: string;
  title: string;
  slug: string;
  original_title: string;
  synopsis: string;
  release_year: string;
  age_rating: string;
  directors: string[];
  writers: string[];
  actors: Array<{ name: string | null }>;
  genres: string[];
  countries: string[];
  languages: string[];
};

type MovieMediaValidationInput = {
  poster_url: string;
  backdrop_url: string;
  trailer_url: string;
  playback_protocol: "hls" | "mp4";
  progressive_url: string;
  hls_url: string;
};

export function resolveMovieSlug(
  slug: string,
  originalTitle: string,
  title: string,
  tmdbId: string,
  buildSlug: (...candidates: Array<string | null | undefined>) => string,
) {
  return (
    slug.trim() ||
    buildSlug(originalTitle, title, tmdbId ? `movie-${tmdbId}` : null)
  );
}

export function validateMovieDetailsTab(
  form: MovieDetailsValidationInput,
  buildSlug: (...candidates: Array<string | null | undefined>) => string,
  entryMode: ContentEntryMode = "tmdb",
): TabFieldIssue[] {
  const issues: TabFieldIssue[] = [];

  if (!form.title.trim()) {
    issues.push({ field: "title", message: "نام فیلم را وارد کنید." });
  }

  if (entryMode === "manual") {
    if (!form.original_title.trim()) {
      issues.push({ field: "original_title", message: "نام اصلی را وارد کنید." });
    }

    if (!form.slug.trim()) {
      issues.push({ field: "slug", message: "slug را وارد کنید." });
    }

    if (!form.synopsis.trim()) {
      issues.push({ field: "synopsis", message: "خلاصه داستان را وارد کنید." });
    }

    if (!form.age_rating.trim()) {
      issues.push({ field: "age_rating", message: "رده‌بندی سنی را انتخاب کنید." });
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
    !resolveMovieSlug(form.slug, form.original_title, form.title, form.tmdb_id, buildSlug)
  ) {
    issues.push({ field: "slug", message: "slug باید مشخص باشد." });
  }

  if (!form.tmdb_id.trim()) {
    issues.push({ field: "tmdb_id", message: "کد TMDB را وارد کنید." });
  }

  if (!form.synopsis.trim()) {
    issues.push({ field: "synopsis", message: "خلاصه داستان را وارد کنید." });
  }

  if (!form.release_year.trim()) {
    issues.push({ field: "release_year", message: "سال انتشار را وارد کنید." });
  }

  if (!form.age_rating.trim()) {
    issues.push({ field: "age_rating", message: "رده‌بندی سنی را انتخاب کنید." });
  }

  if (form.directors.length === 0) {
    issues.push({ field: "directors", message: "حداقل یک کارگردان اضافه کنید." });
  }

  if (!hasValidActors(form.actors)) {
    issues.push({ field: "actors", message: "حداقل یک بازیگر اضافه کنید." });
  }

  return issues;
}

export function validateMovieMediaTab(
  form: MovieMediaValidationInput,
  entryMode: ContentEntryMode = "tmdb",
): TabFieldIssue[] {
  const issues: TabFieldIssue[] = [];

  if (entryMode === "manual") {
    if (!form.poster_url.trim()) {
      issues.push({ field: "poster_url", message: "پوستر را وارد کنید." });
    }

    if (!form.backdrop_url.trim()) {
      issues.push({ field: "backdrop_url", message: "تصویر پس‌زمینه را وارد کنید." });
    }

    if (
      form.playback_protocol === "mp4" &&
      form.progressive_url.trim() &&
      !isProgressiveVideoUrl(form.progressive_url)
    ) {
      issues.push({
        field: "progressive_url",
        message: "آدرس ویدیو مستقیم معتبر (MP4/MKV) را وارد کنید.",
      });
    }

    return issues;
  }

  if (!form.poster_url.trim()) {
    issues.push({ field: "poster_url", message: "پوستر را وارد کنید." });
  }

  if (!form.backdrop_url.trim()) {
    issues.push({ field: "backdrop_url", message: "تصویر پس‌زمینه را وارد کنید." });
  }

  // trailer_url is optional in both TMDB and manual modes.

  if (form.playback_protocol === "mp4") {
    if (
      form.progressive_url.trim() &&
      !isProgressiveVideoUrl(form.progressive_url)
    ) {
      issues.push({
        field: "progressive_url",
        message: "آدرس ویدیو مستقیم معتبر (MP4/MKV) را وارد کنید.",
      });
    }
  } else if (!form.hls_url.trim()) {
    issues.push({ field: "hls_url", message: "مسیر HLS را وارد کنید." });
  }

  return issues;
}

export function validateMovieTab(
  tab: "details" | "media" | "seo" | "publish",
  form: MovieDetailsValidationInput & MovieMediaValidationInput,
  buildSlug: (...candidates: Array<string | null | undefined>) => string,
  entryMode: ContentEntryMode = "tmdb",
): TabFieldIssue[] {
  if (tab === "details") {
    return validateMovieDetailsTab(form, buildSlug, entryMode);
  }

  if (tab === "media") {
    return validateMovieMediaTab(form, entryMode);
  }

  return [];
}
