import { normalizeAgeRating } from "./age-rating";

const persianScriptPattern =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;

const latinPersonNamePattern = /^[A-Za-z0-9][A-Za-z0-9 .,'\-()&]*$/;

export function containsPersianScript(value: string | null | undefined) {
  return persianScriptPattern.test(value ?? "");
}

export function sanitizeLatinPersonName(value: string | null | undefined) {
  return (value ?? "")
    .replace(persianScriptPattern, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function isLatinPersonName(value: string | null | undefined) {
  const trimmed = sanitizeLatinPersonName(value);

  if (!trimmed) {
    return false;
  }

  return latinPersonNamePattern.test(trimmed);
}

/** Prefer Latin script; fall back to any non-empty name (Persian, Arabic, CJK, etc.). */
export function resolvePersonName(
  candidates: Array<string | null | undefined>,
) {
  for (const candidate of candidates) {
    const trimmed = sanitizeLatinPersonName(candidate);

    if (isLatinPersonName(trimmed)) {
      return trimmed;
    }
  }

  for (const candidate of candidates) {
    const trimmed = (candidate ?? "").trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

/** @deprecated Use resolvePersonName — kept for call sites migrating gradually. */
export function resolveLatinPersonName(
  candidates: Array<string | null | undefined>,
) {
  return resolvePersonName(candidates);
}

export function filterPersonNameList(values: string[]) {
  return values
    .map((value) => resolvePersonName([value]))
    .filter((name): name is string => name !== "");
}

/** @deprecated Use filterPersonNameList */
export function filterLatinPersonNameList(values: string[]) {
  return filterPersonNameList(values);
}

export function shouldIncludePerson(
  person: { name?: string | null; original_name?: string | null },
) {
  return Boolean(
    (person.name ?? "").trim() || (person.original_name ?? "").trim(),
  );
}

export function isAgeRatingSelected(
  value: string | null | undefined,
  allowedValues: readonly string[],
) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return false;
  }

  if (allowedValues.includes(trimmed)) {
    return true;
  }

  // Legacy letter codes (G, PG-13, …) map to numeric ages used in forms.
  const normalized = normalizeAgeRating(trimmed);

  return Boolean(normalized && allowedValues.includes(normalized));
}
