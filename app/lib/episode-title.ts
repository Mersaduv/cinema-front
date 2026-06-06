const genericEpisodeTitlePattern =
  /^(?:episode|اپیزود|قسمت)\s*#?\s*[\d\u06F0-\u06F9\u0660-\u0669]+$/iu;

function normalizeEpisodeTitleInput(title: string | null | undefined) {
  return (title ?? "")
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, "")
    .trim();
}

export function isGenericEpisodeTitle(title: string | null | undefined) {
  const trimmed = normalizeEpisodeTitleInput(title);

  if (!trimmed) {
    return true;
  }

  return genericEpisodeTitlePattern.test(trimmed);
}

export function resolveEpisodeTitle(
  candidates: Array<string | null | undefined>,
  _episodeNumber?: number | string,
) {
  for (const candidate of candidates) {
    const trimmed = normalizeEpisodeTitleInput(candidate);

    if (trimmed && !isGenericEpisodeTitle(trimmed)) {
      return trimmed;
    }
  }

  return "";
}

export function formatEpisodeHeading(
  episodeNumber: number | string,
  title: string | null | undefined,
  extraCandidates: Array<string | null | undefined> = [],
) {
  const resolvedTitle = resolveEpisodeTitle([title, ...extraCandidates]);

  if (!resolvedTitle) {
    return `قسمت ${episodeNumber}`;
  }

  return `قسمت ${episodeNumber}: ${resolvedTitle}`;
}
