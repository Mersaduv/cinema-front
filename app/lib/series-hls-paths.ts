/**
 * HLS package layout (hls-worker series output):
 *   {series-root}/season-01/episode-01/master.m3u8
 */

export type HlsPackageLevel = "series" | "season" | "episode";

export type ParsedHlsPackagePath = {
  level: HlsPackageLevel;
  seriesBase: string;
  seasonBase: string | null;
  episodeMaster: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
};

export type EpisodeHlsResolveSource = "episode" | "season" | "series" | "";

export type ResolvedEpisodeHls = {
  hlsUrl: string;
  source: EpisodeHlsResolveSource;
};

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/u, "");
}

/** e.g. cinema.af/content2/... → http://cinema.af/content2/... */
export function coerceRemoteMediaUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//iu.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `http:${trimmed}`;
  }

  if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:[:/]|$)/iu.test(trimmed)) {
    return `http://${trimmed.replace(/^\/+/u, "")}`;
  }

  return trimmed;
}

function joinUrl(base: string, segment: string) {
  return `${trimTrailingSlashes(coerceRemoteMediaUrl(base))}/${segment.replace(/^\/+/u, "")}`;
}

export function formatSeasonDirectory(seasonNumber: number | string) {
  const parsed = Number(seasonNumber);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "season-00";
  }

  return `season-${String(Math.trunc(parsed)).padStart(2, "0")}`;
}

export function formatEpisodeDirectory(episodeNumber: number | string) {
  const parsed = Number(episodeNumber);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "episode-00";
  }

  return `episode-${String(Math.trunc(parsed)).padStart(2, "0")}`;
}

/** Package root: strip master.m3u8 and episode/season suffixes when inferring bases. */
export function normalizeHlsBaseUrl(input: string) {
  const trimmed = coerceRemoteMediaUrl(input);

  if (!trimmed) {
    return "";
  }

  let path = trimmed.replace(/\/+$/u, "");

  if (/master\.m3u8$/iu.test(path)) {
    path = path.replace(/\/master\.m3u8$/iu, "");
  }

  const episodeMatch = path.match(/\/episode-(\d+)$/iu);

  if (episodeMatch) {
    path = path.replace(/\/episode-\d+$/iu, "");
  }

  const seasonMatch = path.match(/\/season-(\d+)$/iu);

  if (seasonMatch) {
    path = path.replace(/\/season-\d+$/iu, "");
  }

  return path;
}

export function parseHlsPackagePath(input: string): ParsedHlsPackagePath | null {
  const trimmed = coerceRemoteMediaUrl(input);

  if (!trimmed) {
    return null;
  }

  let working = trimmed.replace(/\/+$/u, "");
  let hasMaster = false;

  if (/master\.m3u8$/iu.test(working)) {
    hasMaster = true;
    working = working.replace(/\/master\.m3u8$/iu, "");
  }

  const episodeMatch = working.match(/\/episode-(\d+)$/iu);

  if (episodeMatch) {
    const episodeNumber = Number(episodeMatch[1]);
    const seasonBase = working.replace(/\/episode-\d+$/iu, "");
    const seasonSegment = seasonBase.match(/\/season-(\d+)$/iu);
    const seasonNumber = seasonSegment ? Number(seasonSegment[1]) : null;
    const seriesBase = seasonSegment
      ? seasonBase.replace(/\/season-\d+$/iu, "")
      : normalizeHlsBaseUrl(seasonBase);
    const episodeDir = working;

    return {
      level: "episode",
      seriesBase,
      seasonBase: seasonSegment ? seasonBase : null,
      episodeMaster: hasMaster ? trimmed : joinUrl(episodeDir, "master.m3u8"),
      seasonNumber,
      episodeNumber,
    };
  }

  const seasonMatch = working.match(/\/season-(\d+)$/iu);

  if (seasonMatch) {
    const seasonNumber = Number(seasonMatch[1]);
    const seriesBase = working.replace(/\/season-\d+$/iu, "");

    return {
      level: "season",
      seriesBase,
      seasonBase: working,
      episodeMaster: hasMaster ? trimmed : null,
      seasonNumber,
      episodeNumber: null,
    };
  }

  return {
    level: "series",
    seriesBase: normalizeHlsBaseUrl(working),
    seasonBase: null,
    episodeMaster: hasMaster ? trimmed : null,
    seasonNumber: null,
    episodeNumber: null,
  };
}

export function buildSeasonHlsBase(seriesBase: string, seasonNumber: number | string) {
  const base = normalizeHlsBaseUrl(seriesBase);

  if (!base) {
    return "";
  }

  return joinUrl(base, formatSeasonDirectory(seasonNumber));
}

export function buildEpisodeHlsUrl(seasonBase: string, episodeNumber: number | string) {
  const base = trimTrailingSlashes(seasonBase);

  if (!base) {
    return "";
  }

  return joinUrl(joinUrl(base, formatEpisodeDirectory(episodeNumber)), "master.m3u8");
}

export function buildEpisodeHlsUrlFromSeries(
  seriesBase: string,
  seasonNumber: number | string,
  episodeNumber: number | string,
) {
  const seasonBase = buildSeasonHlsBase(seriesBase, seasonNumber);

  return seasonBase ? buildEpisodeHlsUrl(seasonBase, episodeNumber) : "";
}

export function comparableHlsPlaylistUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/master\.m3u8$/iu.test(trimmed)) {
    return trimmed.replace(/\/+$/u, "").toLowerCase();
  }

  return `${trimTrailingSlashes(trimmed)}/master.m3u8`.toLowerCase();
}

/** Resolve folder paths and bare host paths to a master playlist URL for preview/sync. */
export function toMasterPlaylistUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  const parsed = parseHlsPackagePath(trimmed);

  if (parsed?.episodeMaster) {
    return parsed.episodeMaster;
  }

  const coerced = coerceRemoteMediaUrl(trimmed);

  if (/master\.m3u8$/iu.test(coerced)) {
    return coerced.replace(/\/+$/u, "");
  }

  return joinUrl(coerced, "master.m3u8");
}

function normalizeComparableHlsValue(value: string) {
  return comparableHlsPlaylistUrl(value);
}

function normalizeComparableBase(value: string) {
  return normalizeHlsBaseUrl(value).toLowerCase();
}

/** Keep manual edits: only replace when empty or still matches the last auto-derived value. */
export function shouldCascadeReplaceBase(
  current: string,
  previousDerived: string,
  nextDerived: string,
) {
  const next = nextDerived.trim();

  if (!next) {
    return false;
  }

  const currentValue = current.trim();

  if (!currentValue) {
    return true;
  }

  const previousValue = previousDerived.trim();

  if (!previousValue) {
    return false;
  }

  return normalizeComparableBase(currentValue) === normalizeComparableBase(previousValue);
}

export function shouldCascadeReplaceEpisode(
  current: string,
  previousDerived: string,
  nextDerived: string,
) {
  const next = nextDerived.trim();

  if (!next) {
    return false;
  }

  const currentValue = current.trim();

  if (!currentValue) {
    return true;
  }

  const previousValue = previousDerived.trim();

  if (!previousValue) {
    return false;
  }

  return normalizeComparableHlsValue(currentValue) === normalizeComparableHlsValue(previousValue);
}

export function deriveSeasonHlsBase(seriesBase: string, seasonNumber: number | string) {
  return buildSeasonHlsBase(seriesBase, seasonNumber);
}

export function deriveEpisodeHlsUrl(
  seriesBase: string,
  seasonBase: string,
  seasonNumber: number | string,
  episodeNumber: number | string,
) {
  const candidates = buildEpisodeHlsPathCandidates({
    seriesBase,
    seasonBase,
    seasonNumber,
    episodeNumber,
  });

  return candidates[0] || "";
}

/** Candidate master playlist URLs ordered from most specific to nested season layout. */
export function buildEpisodeHlsPathCandidates(input: {
  seriesBase: string;
  seasonBase: string;
  seasonNumber: number | string;
  episodeNumber: number | string;
}): string[] {
  const seriesBase = normalizeHlsBaseUrl(input.seriesBase);
  const seasonBase = input.seasonBase.trim();
  const candidates: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const master = toMasterPlaylistUrl(value);

    if (!master) {
      return;
    }

    const key = comparableHlsPlaylistUrl(master);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push(master);
  };

  if (seasonBase) {
    push(buildEpisodeHlsUrl(seasonBase, input.episodeNumber));
  }

  if (seriesBase) {
    push(buildEpisodeHlsUrl(seriesBase, input.episodeNumber));
    push(buildEpisodeHlsUrlFromSeries(seriesBase, input.seasonNumber, input.episodeNumber));
  }

  return candidates;
}

export function resolveHlsDiscoveryBaseUrl(
  seriesBaseUrl: string,
  season: { hls_base_url: string; season_number: string },
) {
  const seasonBase = season.hls_base_url.trim();

  if (seasonBase) {
    return coerceRemoteMediaUrl(seasonBase).replace(/\/+$/u, "");
  }

  return normalizeHlsBaseUrl(seriesBaseUrl);
}

export type EpisodeHlsFillTarget = {
  seasonId: string;
  episodeId: string;
  hlsUrl: string;
};

export type EpisodeHlsFillInput = {
  hls_base_url: string;
  seasons: Array<{
    id: string;
    season_number: string;
    hls_base_url: string;
    episodes: Array<{
      id: string;
      episode_number: string;
      hls_url: string;
      hls_verified: boolean;
    }>;
  }>;
};

/** Fill empty episode HLS paths using the first layout candidate (sync fallback). */
export function fillEmptyEpisodeHlsFromBases<T extends EpisodeHlsFillInput>(
  form: T,
): { nextForm: T; filled: EpisodeHlsFillTarget[] } {
  const seriesBase = normalizeHlsBaseUrl(form.hls_base_url);

  if (!seriesBase) {
    return { nextForm: form, filled: [] };
  }

  const filled: EpisodeHlsFillTarget[] = [];
  let changed = false;

  const nextSeasons = form.seasons.map((season) => {
    const seasonBase = season.hls_base_url.trim();

    const nextEpisodes = season.episodes.map((episode) => {
      if (episode.hls_url.trim()) {
        return episode;
      }

      const candidates = buildEpisodeHlsPathCandidates({
        seriesBase,
        seasonBase,
        seasonNumber: season.season_number,
        episodeNumber: episode.episode_number,
      });
      const derived = candidates[0] || "";

      if (!derived) {
        return episode;
      }

      changed = true;

      filled.push({
        seasonId: season.id,
        episodeId: episode.id,
        hlsUrl: derived,
      });

      return {
        ...episode,
        hls_url: derived,
        hls_verified: false,
      };
    });

    if (nextEpisodes.every((episode, index) => episode === season.episodes[index])) {
      return season;
    }

    return {
      ...season,
      episodes: nextEpisodes,
    };
  });

  if (!changed) {
    return { nextForm: form, filled: [] };
  }

  return {
    nextForm: { ...form, seasons: nextSeasons },
    filled,
  };
}

export type EpisodeHlsDiscoveryGroup = {
  baseUrl: string;
  episodes: HlsExistsCheckEpisode[];
  targetByKey: Map<string, { seasonId: string; episodeId: string }>;
};

/** Group episodes with empty HLS paths for server-side layout probing. */
export function buildEmptyEpisodeHlsDiscoveryGroups(
  form: EpisodeHlsFillInput,
): EpisodeHlsDiscoveryGroup[] {
  const groupMap = new Map<string, EpisodeHlsDiscoveryGroup>();

  for (const season of form.seasons) {
    const seasonNumber = Number(season.season_number);

    if (!Number.isFinite(seasonNumber) || seasonNumber < 1) {
      continue;
    }

    const baseUrl = resolveHlsDiscoveryBaseUrl(form.hls_base_url, season);

    if (!baseUrl) {
      continue;
    }

    for (const episode of season.episodes) {
      if (episode.hls_url.trim()) {
        continue;
      }

      const episodeNumber = Number(episode.episode_number);

      if (!Number.isFinite(episodeNumber) || episodeNumber < 1) {
        continue;
      }

      const episodeKey = hlsExistsEpisodeKey(seasonNumber, episodeNumber);
      const existing = groupMap.get(baseUrl);

      if (existing) {
        existing.episodes.push({ season: seasonNumber, episode: episodeNumber });
        existing.targetByKey.set(episodeKey, {
          seasonId: season.id,
          episodeId: episode.id,
        });
        continue;
      }

      groupMap.set(baseUrl, {
        baseUrl,
        episodes: [{ season: seasonNumber, episode: episodeNumber }],
        targetByKey: new Map([
          [
            episodeKey,
            {
              seasonId: season.id,
              episodeId: episode.id,
            },
          ],
        ]),
      });
    }
  }

  return [...groupMap.values()];
}

export function applyDiscoveredEpisodeHlsToForm<T extends EpisodeHlsFillInput>(
  form: T,
  discoveries: EpisodeHlsFillTarget[],
): { nextForm: T; filled: EpisodeHlsFillTarget[] } {
  if (discoveries.length === 0) {
    return { nextForm: form, filled: [] };
  }

  const discoveryByEpisodeId = new Map(
    discoveries.map((row) => [`${row.seasonId}:${row.episodeId}`, row.hlsUrl] as const),
  );

  const filled: EpisodeHlsFillTarget[] = [];

  const nextSeasons = form.seasons.map((season) => ({
    ...season,
    episodes: season.episodes.map((episode) => {
      const discovered = discoveryByEpisodeId.get(`${season.id}:${episode.id}`);

      if (!discovered || episode.hls_url.trim()) {
        return episode;
      }

      filled.push({
        seasonId: season.id,
        episodeId: episode.id,
        hlsUrl: toMasterPlaylistUrl(discovered),
      });

      return {
        ...episode,
        hls_url: discovered,
        hls_verified: false,
      };
    }),
  }));

  return {
    nextForm: { ...form, seasons: nextSeasons },
    filled,
  };
}

export function resolveEpisodeHlsUrl(input: {
  seriesBase?: string;
  seasonBase?: string;
  episodeHls?: string;
  seasonNumber: number | string;
  episodeNumber: number | string;
}): ResolvedEpisodeHls {
  const explicit = input.episodeHls?.trim() || "";

  if (explicit) {
    return { hlsUrl: explicit, source: "episode" };
  }

  const seasonBase = input.seasonBase?.trim() || "";

  if (seasonBase) {
    const fromSeason = buildEpisodeHlsUrl(seasonBase, input.episodeNumber);

    if (fromSeason) {
      return { hlsUrl: fromSeason, source: "season" };
    }
  }

  const seriesBase = input.seriesBase?.trim() || "";
  const normalizedSeriesBase = normalizeHlsBaseUrl(seriesBase);

  if (normalizedSeriesBase) {
    const flatFromSeries = buildEpisodeHlsUrl(normalizedSeriesBase, input.episodeNumber);

    if (flatFromSeries) {
      return { hlsUrl: flatFromSeries, source: "series" };
    }

    const fromSeries = buildEpisodeHlsUrlFromSeries(
      normalizedSeriesBase,
      input.seasonNumber,
      input.episodeNumber,
    );

    if (fromSeries) {
      return { hlsUrl: fromSeries, source: "series" };
    }
  }

  return { hlsUrl: "", source: "" };
}

export type HlsExistsCheckEpisode = {
  season: number;
  episode: number;
};

export type HlsExistsCheckGroup = {
  baseUrl: string;
  episodes: HlsExistsCheckEpisode[];
  targetByKey: Map<string, { seasonId: string; episodeId: string; hlsUrl: string }>;
};

export function hlsExistsEpisodeKey(season: number, episode: number) {
  return `s${String(season).padStart(2, "0")}e${String(episode).padStart(2, "0")}`;
}

/**
 * Group episodes by series/season HLS root so every season can be checked in parallel.
 */
export function buildHlsExistsCheckGroups(input: {
  seriesBaseUrl: string;
  seasons: Array<{
    id: string;
    season_number: string;
    hls_base_url: string;
    episodes: Array<{ id: string; episode_number: string }>;
  }>;
  targets: Array<{ seasonId: string; episodeId: string; hlsUrl: string }>;
}): HlsExistsCheckGroup[] {
  const groupMap = new Map<string, HlsExistsCheckGroup>();

  for (const target of input.targets) {
    const season = input.seasons.find((row) => row.id === target.seasonId);
    const episode = season?.episodes.find((row) => row.id === target.episodeId);

    if (!season || !episode) {
      continue;
    }

    const seasonNumber = Number(season.season_number);
    const episodeNumber = Number(episode.episode_number);

    if (!Number.isFinite(seasonNumber) || seasonNumber < 1) {
      continue;
    }

    if (!Number.isFinite(episodeNumber) || episodeNumber < 1) {
      continue;
    }

    const baseUrl = resolveHlsDiscoveryBaseUrl(input.seriesBaseUrl, season);

    if (!baseUrl) {
      continue;
    }

    const episodeKey = hlsExistsEpisodeKey(seasonNumber, episodeNumber);
    const existing = groupMap.get(baseUrl);

    if (existing) {
      existing.episodes.push({ season: seasonNumber, episode: episodeNumber });
      existing.targetByKey.set(episodeKey, target);
      continue;
    }

    groupMap.set(baseUrl, {
      baseUrl,
      episodes: [{ season: seasonNumber, episode: episodeNumber }],
      targetByKey: new Map([[episodeKey, target]]),
    });
  }

  return [...groupMap.values()];
}
