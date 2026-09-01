import { isAgeRatingSelected } from "../../../lib/person-name";
import type { SeasonDraft } from "../series/_lib/series-tmdb-sync";
import type { TabFieldIssue } from "./admin-form-tab-validation";

type SeriesIdentityValidationInput = {
  title: string;
  slug: string;
  original_title: string;
  synopsis: string;
  age_rating: string;
  tmdb_id: string;
};

type SeriesSeasonsValidationInput = {
  seasons: SeasonDraft[];
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
): TabFieldIssue[] {
  const issues: TabFieldIssue[] = [];

  if (!form.title.trim()) {
    issues.push({ field: "title", message: "عنوان سریال را وارد کنید." });
  }

  if (
    !resolveSeriesSlug(form.slug, form.original_title, form.title, form.tmdb_id, buildSlug)
  ) {
    issues.push({ field: "slug", message: "slug باید مشخص باشد." });
  }

  if (!form.synopsis.trim()) {
    issues.push({ field: "synopsis", message: "خلاصه داستان را وارد کنید." });
  }

  if (!isAgeRatingSelected(form.age_rating, ageRatingValues)) {
    issues.push({ field: "age_rating", message: "درجه سنی را انتخاب کنید." });
  }

  return issues;
}

export function validateSeriesSeasonsTab(form: SeriesSeasonsValidationInput): TabFieldIssue[] {
  const issues: TabFieldIssue[] = [];

  if (form.seasons.length === 0) {
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
    }
  }

  return issues;
}

export function validateSeriesTab(
  tab: "identity" | "catalog" | "seo" | "seasons" | "publish",
  form: SeriesIdentityValidationInput & SeriesSeasonsValidationInput,
  buildSlug: (...candidates: Array<string | null | undefined>) => string,
  ageRatingValues: readonly string[],
): TabFieldIssue[] {
  if (tab === "identity") {
    return validateSeriesIdentityTab(form, buildSlug, ageRatingValues);
  }

  if (tab === "seasons") {
    return validateSeriesSeasonsTab(form);
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
