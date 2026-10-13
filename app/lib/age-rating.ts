/**
 * Canonical age ratings are numeric minimum ages.
 * Letter codes (G, PG, …) map to the same meaning for display and forms.
 */

export const MOVIE_AGE_RATING_VALUES = ["0", "7", "13", "17", "18"] as const;
export const SERIES_AGE_RATING_VALUES = ["0", "7", "13", "16", "17", "18"] as const;

export type MovieAgeRatingValue = (typeof MOVIE_AGE_RATING_VALUES)[number];
export type SeriesAgeRatingValue = (typeof SERIES_AGE_RATING_VALUES)[number];

type AgeRatingOption = {
  value: string;
  label: string;
  description?: string;
};

const LETTER_TO_AGE: Record<string, string> = {
  G: "0",
  "TV-Y": "0",
  "TV-Y7": "0",
  "TV-G": "0",
  PG: "7",
  "TV-PG": "7",
  NR: "7",
  "PG-13": "13",
  "TV-14": "13",
  "12": "13",
  "12A": "13",
  "16+": "16",
  "16": "16",
  "15": "16",
  R: "17",
  "TV-MA": "17",
  "18+": "18",
  "18": "18",
  "NC-17": "18",
  X: "18",
  R18: "18",
};

const AGE_DESCRIPTIONS: Record<string, string> = {
  "0": "مناسب همه سنین (معادل G)",
  "7": "تماشا با راهنمایی والدین (معادل PG)",
  "13": "مناسب ۱۳ سال به بالا (معادل PG-13)",
  "16": "مناسب ۱۶ سال به بالا",
  "17": "نیازمند محدودیت سنی (معادل R)",
  "18": "ویژه بزرگسالان (معادل ۱۸+)",
};

function extractLeadingAge(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\+?$/);
  return match ? match[1] : null;
}

/** Normalize any stored/TMDB rating to a pure age number string (e.g. "13"). */
export function normalizeAgeRating(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const fromLetter = LETTER_TO_AGE[trimmed.toUpperCase()] ?? LETTER_TO_AGE[trimmed];
  if (fromLetter) {
    return fromLetter;
  }

  return extractLeadingAge(trimmed);
}

/** Viewer display: age number with "+" (e.g. "13+"), never letter codes. */
export function formatAgeRatingLabel(value: string | null | undefined): string | null {
  const age = normalizeAgeRating(value);
  return age == null ? null : `${age}+`;
}

export function movieAgeRatingOptions(includeEmpty = true): AgeRatingOption[] {
  const options: AgeRatingOption[] = MOVIE_AGE_RATING_VALUES.map((value) => ({
    value,
    label: value,
    description: AGE_DESCRIPTIONS[value],
  }));

  if (!includeEmpty) {
    return options;
  }

  return [
    { value: "", label: "بدون درجه سنی", description: "در صورت نیاز بعداً تعیین می‌شود" },
    ...options,
  ];
}

export function seriesAgeRatingOptions(includeEmpty = true): AgeRatingOption[] {
  const options: AgeRatingOption[] = SERIES_AGE_RATING_VALUES.map((value) => ({
    value,
    label: value,
    description: AGE_DESCRIPTIONS[value],
  }));

  if (!includeEmpty) {
    return options;
  }

  return [{ value: "", label: "انتخاب درجه سنی *" }, ...options];
}

/** Values accepted as selected in forms (canonical + legacy letter aliases). */
export function ageRatingAllowedValues(canonical: readonly string[]): string[] {
  const allowed = new Set<string>(canonical);
  for (const [letter, age] of Object.entries(LETTER_TO_AGE)) {
    if (canonical.includes(age)) {
      allowed.add(letter);
      allowed.add(letter.toUpperCase());
      allowed.add(letter.toLowerCase());
    }
  }
  return [...allowed];
}
