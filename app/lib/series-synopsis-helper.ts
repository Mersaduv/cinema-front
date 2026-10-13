/**
 * Season/episode synopsis helper: Persian in synopsis, English TMDB reference in synopsis_en.
 */

const PERSIAN_SCRIPT_RE = /[\u0600-\u06FF]/;

export function hasPersianSynopsisScript(text: string | null | undefined): boolean {
  const value = typeof text === "string" ? text.trim() : "";
  return value.length > 0 && PERSIAN_SCRIPT_RE.test(value);
}

export type SeasonEpisodeSynopsisFields = {
  synopsis: string;
  synopsis_en: string;
};

/** TMDB payloads may expose localized text as synopsis and/or overview. */
export function resolveTmdbMainSynopsis(payload: {
  synopsis?: string | null;
  overview?: string | null;
}): string | null | undefined {
  const synopsis = typeof payload.synopsis === "string" ? payload.synopsis.trim() : "";
  if (synopsis) {
    return synopsis;
  }

  const overview = typeof payload.overview === "string" ? payload.overview.trim() : "";
  return overview || null;
}

/** Normalize API/DB values for the editor (no client-side translation). */
export function normalizeSeasonEpisodeSynopsis(
  synopsis: string | null | undefined,
  synopsisEn: string | null | undefined,
): SeasonEpisodeSynopsisFields {
  const raw = typeof synopsis === "string" ? synopsis.trim() : "";
  const en = typeof synopsisEn === "string" ? synopsisEn.trim() : "";

  if (hasPersianSynopsisScript(raw)) {
    return { synopsis: raw, synopsis_en: en };
  }

  if (raw) {
    // Keep non-Persian admin text visible in the editable primary field.
    return { synopsis: raw, synopsis_en: en || raw };
  }

  if (en) {
    return { synopsis: en, synopsis_en: en };
  }

  return { synopsis: "", synopsis_en: "" };
}

/** Merge TMDB season/episode/movie synopsis into form drafts. */
export function mergeSeasonEpisodeSynopsisFromTmdb(
  tmdbSynopsis: string | null | undefined,
  tmdbSynopsisEn: string | null | undefined,
  currentSynopsis?: string,
  currentSynopsisEn?: string,
): SeasonEpisodeSynopsisFields {
  const raw = typeof tmdbSynopsis === "string" ? tmdbSynopsis.trim() : "";
  const en = typeof tmdbSynopsisEn === "string" ? tmdbSynopsisEn.trim() : "";

  if (hasPersianSynopsisScript(raw)) {
    return {
      synopsis: raw,
      synopsis_en: en || "",
    };
  }

  // English-only TMDB text belongs in the reference note until a Persian
  // translation is available — never pretend it is the Persian synopsis.
  const englishOnly = en || raw;
  if (englishOnly) {
    const current = normalizeSeasonEpisodeSynopsis(currentSynopsis, currentSynopsisEn);
    if (hasPersianSynopsisScript(current.synopsis)) {
      return {
        synopsis: current.synopsis,
        synopsis_en: englishOnly || current.synopsis_en,
      };
    }

    return {
      synopsis: "",
      synopsis_en: englishOnly,
    };
  }

  return normalizeSeasonEpisodeSynopsis(currentSynopsis, currentSynopsisEn);
}
