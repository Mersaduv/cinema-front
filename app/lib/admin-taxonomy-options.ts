import type { MultiSelectOption } from "../components/ui/SearchableMultiSelect";
import { localizeGenreLabels } from "./genre-labels";
import { normalizeListItemLabel } from "./list-item-label";

export type AdminTaxonomyGenre = {
  id: number;
  tmdb_id?: number | null;
  name: string;
  slug: string;
};

export type AdminTaxonomyCountry = {
  iso: string;
  name: string;
  flag?: string | null;
};

export type AdminTaxonomyLanguage = {
  iso: string;
  name: string;
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\u200c/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ـ]/g, "")
    .replace(/[-‑–_()[\]{},./\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Common TMDB/fa labels that differ from catalog option names. */
const COUNTRY_LABEL_ALIASES: Record<string, string> = {
  آمریکا: "US",
  امریکا: "US",
  "ایالات متحده": "US",
  "ایالات متحده آمریکا": "US",
  "ایالات متحده امریکا": "US",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  us: "US",
  بریتانیا: "GB",
  انگلیس: "GB",
  انگلستان: "GB",
  uk: "GB",
  "united kingdom": "GB",
  "کره جنوبی": "KR",
  کره: "KR",
  "south korea": "KR",
  ایران: "IR",
  iran: "IR",
};

const LANGUAGE_LABEL_ALIASES: Record<string, string> = {
  انگلیسی: "en",
  english: "en",
  فارسی: "fa",
  persian: "fa",
  farsi: "fa",
  عربی: "ar",
  arabic: "ar",
  ترکی: "tr",
  turkish: "tr",
  فرانسوی: "fr",
  french: "fr",
  آلمانی: "de",
  german: "de",
  اسپانیایی: "es",
  spanish: "es",
  روسی: "ru",
  russian: "ru",
  هندی: "hi",
  hindi: "hi",
  ژاپنی: "ja",
  japanese: "ja",
  "کره ای": "ko",
  کره‌ای: "ko",
  korean: "ko",
  چینی: "zh",
  chinese: "zh",
  mandarin: "zh",
  ایتالیایی: "it",
  italian: "it",
  پرتغالی: "pt",
  portuguese: "pt",
};

function indexLabelParts(
  map: Map<string, string>,
  label: string,
  value: string,
): void {
  const full = normalizeKey(label);
  if (full) {
    map.set(full, value);
  }

  const open = label.indexOf("(");
  const close = label.indexOf(")");
  if (open > 0) {
    const primary = normalizeKey(label.slice(0, open));
    if (primary) {
      map.set(primary, value);
    }
  }
  if (open >= 0 && close > open) {
    const nested = normalizeKey(label.slice(open + 1, close));
    if (nested) {
      map.set(nested, value);
    }
  }
}

function resolveAliasIso(
  label: string,
  aliases: Record<string, string>,
): string | undefined {
  const key = normalizeKey(label);
  if (!key) {
    return undefined;
  }

  const direct = aliases[key] ?? aliases[label.trim()];
  if (direct) {
    return direct;
  }

  // Also try without spaces for compact Persian compound keys.
  return aliases[key.replace(/\s+/g, "")] ?? undefined;
}

export function toGenreSelectOptions(
  genres: AdminTaxonomyGenre[] | null | undefined,
): MultiSelectOption[] {
  return (genres ?? [])
    .map((genre) => ({
      value: genre.name.trim(),
      label: genre.name.trim(),
    }))
    .filter((option) => option.value.length > 0 && option.label.length > 0);
}

export function toCountrySelectOptions(
  countries: AdminTaxonomyCountry[] | null | undefined,
): MultiSelectOption[] {
  return (countries ?? [])
    .map((country) => {
      const iso = country.iso.trim().toUpperCase();
      const label = (country.name || "").trim() || iso;
      return {
        value: iso,
        label,
        // Avoid emoji flags in admin — many Windows hosts render them as ?????
      };
    })
    .filter((option) => option.value.length > 0 && option.label.length > 0);
}

export function toLanguageSelectOptions(
  languages: AdminTaxonomyLanguage[] | null | undefined,
): MultiSelectOption[] {
  return (languages ?? [])
    .map((language) => {
      const iso = language.iso.trim().toLowerCase();
      const label = (language.name || "").trim() || iso.toUpperCase();
      return {
        value: iso,
        label,
      };
    })
    .filter((option) => option.value.length > 0 && option.label.length > 0);
}

/** Keep only catalog genre labels (same vocabulary as filter control). */
export function normalizeGenreValuesToCatalog(
  values: unknown[] | null | undefined,
  options: MultiSelectOption[],
): string[] {
  if (!values?.length) {
    return [];
  }

  const allowed = new Map(
    options.map((option) => [normalizeKey(option.value), option.value]),
  );

  const localized = localizeGenreLabels(values);
  const next: string[] = [];
  const seen = new Set<string>();

  for (const label of localized) {
    const matched = allowed.get(normalizeKey(label));
    if (!matched || seen.has(matched)) {
      continue;
    }
    seen.add(matched);
    next.push(matched);
  }

  return next;
}

/** Resolve free-text / TMDB country labels to ISO codes used by filter control. */
export function normalizeCountryValuesToIso(
  values: unknown[] | null | undefined,
  countries: AdminTaxonomyCountry[] | null | undefined,
): string[] {
  if (!values?.length) {
    return [];
  }

  const byIso = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const country of countries ?? []) {
    const iso = country.iso.toUpperCase();
    byIso.set(iso.toLowerCase(), iso);
    indexLabelParts(byName, country.name, iso);
  }

  for (const [alias, iso] of Object.entries(COUNTRY_LABEL_ALIASES)) {
    byName.set(normalizeKey(alias), iso.toUpperCase());
  }

  const next: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const label = normalizeListItemLabel(raw);
    if (!label) {
      continue;
    }

    const iso =
      (label.length === 2 && /^[a-zA-Z]{2}$/.test(label)
        ? byIso.get(label.toLowerCase())
        : undefined) ??
      byIso.get(label.toLowerCase()) ??
      byName.get(normalizeKey(label)) ??
      resolveAliasIso(label, COUNTRY_LABEL_ALIASES)?.toUpperCase();

    if (!iso || seen.has(iso)) {
      continue;
    }

    // Only keep codes that exist in catalog options when options were provided.
    if ((countries?.length ?? 0) > 0 && !byIso.has(iso.toLowerCase())) {
      continue;
    }

    seen.add(iso);
    next.push(iso);
  }

  return next;
}

/** Resolve free-text / TMDB language labels to ISO codes used by filter control. */
export function normalizeLanguageValuesToIso(
  values: unknown[] | null | undefined,
  languages: AdminTaxonomyLanguage[] | null | undefined,
): string[] {
  if (!values?.length) {
    return [];
  }

  const byIso = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const language of languages ?? []) {
    const iso = language.iso.toLowerCase();
    byIso.set(iso, iso);
    indexLabelParts(byName, language.name, iso);
  }

  for (const [alias, iso] of Object.entries(LANGUAGE_LABEL_ALIASES)) {
    byName.set(normalizeKey(alias), iso.toLowerCase());
  }

  const next: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const label = normalizeListItemLabel(raw);
    if (!label) {
      continue;
    }

    const iso =
      (label.length <= 3 && /^[a-zA-Z]{2,3}$/.test(label)
        ? byIso.get(label.toLowerCase())
        : undefined) ??
      byIso.get(label.toLowerCase()) ??
      byName.get(normalizeKey(label)) ??
      resolveAliasIso(label, LANGUAGE_LABEL_ALIASES)?.toLowerCase();

    if (!iso || seen.has(iso)) {
      continue;
    }

    if ((languages?.length ?? 0) > 0 && !byIso.has(iso)) {
      continue;
    }

    seen.add(iso);
    next.push(iso);
  }

  return next;
}

export function normalizeOriginalLanguageToIso(
  value: string | null | undefined,
  languages: AdminTaxonomyLanguage[] | null | undefined,
): string {
  const matched = normalizeLanguageValuesToIso(
    value ? [value] : [],
    languages,
  );
  return matched[0] ?? "";
}

/** Persist country names (resolved from ISO) so metadata stays readable; filter uses ISO via backend resolve. */
export function countryLabelsForSave(
  isos: string[],
  countries: AdminTaxonomyCountry[] | null | undefined,
): string[] {
  const byIso = new Map(
    (countries ?? []).map((country) => [
      country.iso.toUpperCase(),
      country.name,
    ]),
  );

  return isos
    .map((iso) => byIso.get(iso.toUpperCase()) ?? iso.toUpperCase())
    .filter(Boolean);
}

/** Persist ISO codes so language filters (original_language) stay aligned. */
export function languageValuesForSave(isos: string[]): string[] {
  return Array.from(
    new Set(
      isos
        .map((iso) => iso.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}
