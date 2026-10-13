export type ContentEntryMode = "tmdb" | "manual";

export function isManualEntryMode(mode: ContentEntryMode): boolean {
  return mode === "manual";
}

/**
 * Create defaults to TMDB. Edit without TMDB id (or saved manual) → manual.
 */
export function resolveContentEntryMode(options: {
  savedSource?: string | null;
  tmdbId?: string | number | null;
  isCreate?: boolean;
}): ContentEntryMode {
  const saved = (options.savedSource || "").trim().toLowerCase();

  if (saved === "manual") {
    return "manual";
  }

  if (saved === "tmdb") {
    return "tmdb";
  }

  if (options.isCreate) {
    return "tmdb";
  }

  const id = options.tmdbId;
  if (id != null && String(id).trim() !== "" && String(id).trim() !== "0") {
    return "tmdb";
  }

  return "manual";
}
