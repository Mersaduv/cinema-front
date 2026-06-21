/** English TMDB labels that duplicate a Persian catalog row — never show in filter UI. */
const REDUNDANT_ENGLISH_LABELS = new Set([
  "Drama",
  "Action & Adventure",
  "Sci-Fi & Fantasy",
  "Science Fiction",
]);

/** English slug variants from raw TMDB sync — not manifest slugs like `sci-fi-fantasy`. */
const REDUNDANT_SLUGS = new Set([
  "action-and-adventure",
  "science-fiction-and-fantasy",
]);

export function buildGenreFilterOptions(
  genres: Array<{ id: number; slug: string; name: string; tmdb_id?: number | null }>,
): GenreFilterOptionInput[] {
  const seenLabels = new Set<string>();
  const seenTmdb = new Set<number>();

  return genres
    .filter((genre) => {
      const label = genre.name.trim();
      if (REDUNDANT_ENGLISH_LABELS.has(label)) {
        return false;
      }
      if (REDUNDANT_SLUGS.has(genre.slug)) {
        return false;
      }
      return true;
    })
    .filter((genre) => {
      const labelKey = genre.name.trim().replace(/\s+/g, " ");
      if (seenLabels.has(labelKey)) {
        return false;
      }
      if (genre.tmdb_id != null) {
        if (seenTmdb.has(genre.tmdb_id)) {
          return false;
        }
        seenTmdb.add(genre.tmdb_id);
      }
      seenLabels.add(labelKey);
      return true;
    })
    .map((genre) => ({
      value: String(genre.id),
      label: genre.name,
      tmdb_id: genre.tmdb_id,
    }));
}

export type GenreFilterOptionInput = {
  value: string;
  label: string;
  tmdb_id?: number | null;
};

export function canonicalizeGenreFilterValues(
  selected: string[],
  aliasMap: Record<string, string> = {},
): string[] {
  if (selected.length === 0 || Object.keys(aliasMap).length === 0) {
    return selected;
  }

  const seen = new Set<string>();

  return selected
    .map((value) => aliasMap[value] ?? value)
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
}
