import type { TmdbActor, TmdbMoviePayload } from "./admin-movies";
import { toManagedImagePublicPath } from "./cinema-image";

export type IngestTmdbImagesPayload = {
  entity_id?: number | string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
  actors?: ActorWithProfile[];
  seasons?: Array<{
    season_number?: number | string | null;
    poster_url?: string | null;
    episodes?: Array<{
      episode_number?: number | string | null;
      still_url?: string | null;
    }>;
  }>;
};

export type IngestTmdbImagesResult = {
  poster_url?: string | null;
  backdrop_url?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
  actors?: ActorWithProfile[];
  seasons?: IngestTmdbImagesPayload["seasons"];
  stats?: {
    requested: number;
    succeeded: number;
    failed: number;
  };
};

export type ActorWithProfile = {
  profile_url?: string | null;
  profile_image?: { original?: string | null; src?: string | null } | null;
  tmdb_person_id?: number | null;
  credit_id?: string | null;
  profile_source_url?: string | null;
};

const IMAGE_PROCESSING_MESSAGE_PATTERN =
  /[;؛]?\s*(پردازش تصاویر[^.]*|تصاویر[^.]*در حال[^.]*|فصل‌ها در حال بارگذاری[^.]*)\.?/g;

export function finalizeTmdbImageIngestMessage(previousMessage?: string | null): string {
  const stripped = (previousMessage ?? "")
    .replace(IMAGE_PROCESSING_MESSAGE_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[;؛]\s*$/, "")
    .trim();

  if (!stripped) {
    return "تصاویر پردازش شدند.";
  }

  if (stripped.endsWith("تصاویر پردازش شدند.")) {
    return stripped;
  }

  const separator = /[.!؟?]$/.test(stripped) ? " " : ". ";

  return `${stripped}${separator}تصاویر پردازش شدند.`;
}

export function withTmdbImageProcessingMessage(
  previousMessage: string | null | undefined,
  processingMessage: string,
): string {
  const base = (previousMessage ?? "").replace(IMAGE_PROCESSING_MESSAGE_PATTERN, "").trim();

  return base ? `${base} ${processingMessage}` : processingMessage;
}

export function buildMovieTmdbImageIngestPayload(
  payload: TmdbMoviePayload,
  entityId?: string | number | null,
): IngestTmdbImagesPayload {
  return {
    entity_id: entityId ?? null,
    poster_url: payload.poster_url ?? null,
    backdrop_url: payload.backdrop_url ?? null,
    actors: payload.cast?.length ? payload.cast : payload.actors ?? [],
  };
}

function actorMatchKey(actor: ActorWithProfile): string | null {
  if (typeof actor.tmdb_person_id === "number" && actor.tmdb_person_id > 0) {
    return `person:${actor.tmdb_person_id}`;
  }

  const creditId = actor.credit_id?.trim();
  if (creditId) {
    return `credit:${creditId}`;
  }

  const sourceUrl = actor.profile_source_url?.trim() || actor.profile_url?.trim();
  if (sourceUrl && !toManagedImagePublicPath(sourceUrl)) {
    return `url:${sourceUrl}`;
  }

  return null;
}

function buildProcessedActorLookup<T extends ActorWithProfile>(
  processed: T[] | undefined,
): Map<string, T> {
  const lookup = new Map<string, T>();

  if (!processed?.length) {
    return lookup;
  }

  processed.forEach((actor, index) => {
    const key = actorMatchKey(actor);
    if (key) {
      lookup.set(key, actor);
    }

    lookup.set(`index:${index}`, actor);
  });

  return lookup;
}

export function mergeIngestedActorProfiles<T extends ActorWithProfile>(
  current: T[],
  processed: ActorWithProfile[] | undefined,
): T[] {
  if (!processed?.length) {
    return current;
  }

  const lookup = buildProcessedActorLookup(processed);

  return current.map((actor, index) => {
    const key = actorMatchKey(actor);
    const match =
      (key ? lookup.get(key) : undefined) ??
      lookup.get(`index:${index}`) ??
      processed[index];
    const profileUrl = toManagedImagePublicPath(match?.profile_url);

    if (!profileUrl) {
      return actor;
    }

    return {
      ...actor,
      profile_url: profileUrl,
      profile_image: match.profile_image ?? actor.profile_image ?? null,
      profile_source_url:
        match.profile_source_url ??
        actor.profile_source_url ??
        (toManagedImagePublicPath(actor.profile_url) ? null : actor.profile_url),
    };
  });
}

export function buildSeriesTmdbImageIngestPayload(input: {
  entityId?: string | number | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  actors?: ActorWithProfile[];
  seasons?: Array<{
    season_number: string;
    poster_url: string;
    episodes: Array<{
      episode_number: string;
      still_url: string;
    }>;
  }>;
  includeSeasons?: boolean;
}): IngestTmdbImagesPayload {
  return {
    entity_id: input.entityId ?? null,
    poster_url: input.poster_url ?? null,
    backdrop_url: input.backdrop_url ?? null,
    actors: input.actors ?? [],
    seasons: input.includeSeasons
      ? (input.seasons ?? []).map((season) => ({
          season_number: season.season_number,
          poster_url: season.poster_url || null,
          episodes: season.episodes.map((episode) => ({
            episode_number: episode.episode_number,
            still_url: episode.still_url || null,
          })),
        }))
      : undefined,
  };
}

/** Keep processed /images/ paths when merging TMDB season data over form state. */
export function preserveIngestedPrimaryImages<
  T extends {
    poster_url: string;
    backdrop_url: string;
    poster_source_url?: string;
    backdrop_source_url?: string;
  },
>(next: T, current: T): T {
  const managedPoster = toManagedImagePublicPath(current.poster_url);
  const managedBackdrop = toManagedImagePublicPath(current.backdrop_url);

  if (!managedPoster && !managedBackdrop) {
    return next;
  }

  return {
    ...next,
    ...(managedPoster
      ? {
          poster_url: managedPoster,
          poster_source_url:
            current.poster_source_url?.trim() || next.poster_source_url || "",
        }
      : {}),
    ...(managedBackdrop
      ? {
          backdrop_url: managedBackdrop,
          backdrop_source_url:
            current.backdrop_source_url?.trim() || next.backdrop_source_url || "",
        }
      : {}),
  };
}

export function applyIngestedPrimaryImages<
  T extends { poster_url: string; backdrop_url: string },
>(
  form: T,
  data: IngestTmdbImagesResult,
  sources?: { poster_url?: string | null; backdrop_url?: string | null },
): T & { poster_source_url?: string; backdrop_source_url?: string } {
  const posterUrl = data.poster_url?.trim();
  const backdropUrl = data.backdrop_url?.trim();
  const posterSource =
    sources?.poster_url?.trim() ||
    (form.poster_url.startsWith("http") ? form.poster_url : "");
  const backdropSource =
    sources?.backdrop_url?.trim() ||
    (form.backdrop_url.startsWith("http") ? form.backdrop_url : "");

  const managedPoster = toManagedImagePublicPath(posterUrl);
  const managedBackdrop = toManagedImagePublicPath(backdropUrl);

  return {
    ...form,
    poster_url: managedPoster ?? form.poster_url,
    backdrop_url: managedBackdrop ?? form.backdrop_url,
    ...(posterSource ? { poster_source_url: posterSource } : {}),
    ...(backdropSource ? { backdrop_source_url: backdropSource } : {}),
  };
}

export function applyIngestedSeasonImages<
  TSeason extends {
    season_number: string;
    poster_url: string;
    episodes: Array<{ episode_number: string; still_url: string }>;
  },
>(seasons: TSeason[], processed: IngestTmdbImagesPayload["seasons"]): TSeason[] {
  if (!processed?.length) {
    return seasons;
  }

  const processedBySeasonNumber = new Map(
    processed.map((season, index) => [
      String(season?.season_number ?? index).trim(),
      season,
    ]),
  );

  return seasons.map((season, seasonIndex) => {
    const match =
      processedBySeasonNumber.get(season.season_number.trim()) ??
      processed[seasonIndex];

    if (!match) {
      return season;
    }

    const posterUrl = toManagedImagePublicPath(match.poster_url);

    return {
      ...season,
      poster_url: posterUrl ?? season.poster_url,
      episodes: season.episodes.map((episode, episodeIndex) => {
        const episodeMatch =
          match.episodes?.find(
            (row) =>
              String(row?.episode_number ?? "").trim() === episode.episode_number.trim(),
          ) ?? match.episodes?.[episodeIndex];
        const stillUrl = toManagedImagePublicPath(episodeMatch?.still_url);

        return {
          ...episode,
          still_url: stillUrl ?? episode.still_url,
        };
      }),
    };
  });
}

export function buildSeriesPrimaryIngestSource(input: {
  poster_url: string;
  backdrop_url: string;
  actors: ActorWithProfile[];
  poster_source_url?: string;
  backdrop_source_url?: string;
}) {
  const posterCandidate =
    input.poster_source_url?.trim() ||
    (input.poster_url.startsWith("http") || input.poster_url.startsWith("//")
      ? input.poster_url
      : "");
  const backdropCandidate =
    input.backdrop_source_url?.trim() ||
    (input.backdrop_url.startsWith("http") || input.backdrop_url.startsWith("//")
      ? input.backdrop_url
      : "");

  return {
    poster_url: posterCandidate || null,
    backdrop_url: backdropCandidate || null,
    actors: input.actors,
  };
}

export function buildSeriesSeasonIngestSource(season: {
  season_number: string;
  poster_url: string;
  episodes: Array<{ episode_number: string; still_url: string }>;
}) {
  return {
    seasons: [
      {
        season_number: season.season_number,
        poster_url: season.poster_url,
        episodes: season.episodes.map((episode) => ({
          episode_number: episode.episode_number,
          still_url: episode.still_url,
        })),
      },
    ],
  };
}
