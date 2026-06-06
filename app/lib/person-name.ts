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

export function resolveLatinPersonName(
  candidates: Array<string | null | undefined>,
) {
  for (const candidate of candidates) {
    const trimmed = sanitizeLatinPersonName(candidate);

    if (isLatinPersonName(trimmed)) {
      return trimmed;
    }
  }

  return "";
}

export function filterLatinPersonNameList(values: string[]) {
  return values
    .map((value) => resolveLatinPersonName([value]))
    .filter((name): name is string => name !== "");
}

export function isAgeRatingSelected(
  value: string | null | undefined,
  allowedValues: readonly string[],
) {
  const trimmed = (value ?? "").trim();

  return trimmed !== "" && allowedValues.includes(trimmed);
}
