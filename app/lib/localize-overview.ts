import {
  hasPersianSynopsisScript,
  mergeSeasonEpisodeSynopsisFromTmdb,
  normalizeSeasonEpisodeSynopsis,
} from "./series-synopsis-helper";

export const hasPersianScript = hasPersianSynopsisScript;
export const normalizeLocalizedSynopsis = normalizeSeasonEpisodeSynopsis;
export const mergeSynopsisFromTmdb = mergeSeasonEpisodeSynopsisFromTmdb;

/**
 * Show Persian overview when available; otherwise fall back to the stored English synopsis.
 */
export function displayOverview(
  english: string | null | undefined,
  persian: string | null | undefined,
): string {
  const fa = typeof persian === "string" ? persian.trim() : "";
  if (fa) {
    return fa;
  }

  return typeof english === "string" ? english.trim() : "";
}

export function hasPersianOverview(
  english: string | null | undefined,
  persian: string | null | undefined,
): boolean {
  return hasPersianSynopsisScript(persian);
}
