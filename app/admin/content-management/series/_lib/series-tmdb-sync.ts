import { localizeGenreLabels } from "../../../../lib/genre-labels";
import { resolveEpisodeTitle } from "../../../../lib/episode-title";
import { filterLatinPersonNameList, resolveLatinPersonName } from "../../../../lib/person-name";
import {
  mergeSeasonEpisodeSynopsisFromTmdb,
  resolveTmdbMainSynopsis,
} from "../../../../lib/series-synopsis-helper";
import { sortCastByOrder } from "../../../../lib/cast-utils";
import type {
  AdminSeriesActor,
  AdminSeriesEpisode,
  AdminSeriesSeason,
  SeriesPublishStatus,
  TmdbSeriesPayload,
} from "../../../../lib/admin-series";

export type EpisodeDraft = {
  id: string;
  episode_number: string;
  title: string;
  synopsis: string;
  synopsis_en: string;
  air_date: string;
  duration_minutes: string;
  still_url: string;
  source_method: "upload" | "embed" | "url" | "hls";
  video_url: string;
  embed_url: string;
  hls_url: string;
  hls_verified: boolean;
  dash_url: string;
  dash_verified: boolean;
  download_links: Record<string, string>;
  subtitle_url: string;
  dubbed_audio_url: string;
  publish_status: SeriesPublishStatus;
};

export type SeasonDraft = {
  id: string;
  season_number: string;
  name: string;
  synopsis: string;
  synopsis_en: string;
  air_date: string;
  episode_count: string;
  poster_url: string;
  hls_base_url: string;
  episodes: EpisodeDraft[];
};

export type SeriesCrewFormRow = {
  tmdb_person_id: number | null;
  name: string;
  job: string;
  department: string;
  profile_url: string | null;
  credit_id: string | null;
};

export type TmdbExcludedEpisode = {
  season_number: number;
  episode_number: number;
};

export type SeriesFormState = {
  title: string;
  slug: string;
  original_title: string;
  synopsis: string;
  synopsis_en: string;
  first_air_date: string;
  last_air_date: string;
  release_year: string;
  status: string;
  episode_runtime_minutes: string;
  number_of_seasons: string;
  number_of_episodes: string;
  network: string;
  provider_name: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url: string;
  homepage_url: string;
  age_rating: string;
  is_featured: boolean;
  publish_status: SeriesPublishStatus;
  scheduled_for: string;
  tmdb_query: string;
  tmdb_id: string;
  imdb_id: string;
  tvdb_id: string;
  rating: string;
  popularity: string;
  vote_count: string;
  original_language: string;
  creators: string[];
  directors: string[];
  writers: string[];
  genres: string[];
  tags: string[];
  languages: string[];
  countries: string[];
  actors: AdminSeriesActor[];
  crew: SeriesCrewFormRow[];
  hls_base_url: string;
  drm_scheme: string;
  drm_license_url: string;
  seasons: SeasonDraft[];
  tmdb_excluded_season_numbers: number[];
  tmdb_excluded_episodes: TmdbExcludedEpisode[];
};

export type TmdbSyncPhase =
  | "idle"
  | "fetching_overview"
  | "fetching_seasons"
  | "done"
  | "error";

export type TmdbSeasonSyncStatus = "pending" | "loading" | "done" | "error";

export type TmdbSyncState = {
  phase: TmdbSyncPhase;
  overviewReady: boolean;
  seasonProgress: Array<{ season_number: number; status: TmdbSeasonSyncStatus }>;
};

export const initialTmdbSyncState: TmdbSyncState = {
  phase: "idle",
  overviewReady: false,
  seasonProgress: [],
};

export type MergeSeasonFromTmdbOptions = {
  fullSeasonResync?: boolean;
  importEpisodeNumbers?: number[];
};

export function uniqueId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildSlug(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const slug = slugify(candidate || "");

    if (slug) {
      return slug;
    }
  }

  return "";
}

function pickNonEmptyText(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

export function isTmdbEpisodeExcluded(
  exclusions: TmdbExcludedEpisode[],
  seasonNumber: number,
  episodeNumber: number,
): boolean {
  return exclusions.some(
    (row) =>
      row.season_number === seasonNumber && row.episode_number === episodeNumber,
  );
}

export function isTmdbSeasonExcluded(
  excludedSeasonNumbers: number[],
  seasonNumber: number,
): boolean {
  return excludedSeasonNumbers.includes(seasonNumber);
}

function normalizeActors(actors: AdminSeriesActor[]) {
  return sortCastByOrder(
    actors.flatMap((actor) => {
      const name = resolveLatinPersonName([actor.name]);

      if (!name) {
        return [];
      }

      return [{ ...actor, name }];
    }),
  );
}

export function mergeEpisodeDraftFromTmdb(
  episode: AdminSeriesEpisode,
  currentEpisode: EpisodeDraft | undefined,
  current: SeriesFormState,
): EpisodeDraft {
  const episodeNumber = String(episode.episode_number);

  return {
    id: currentEpisode?.id || uniqueId("episode"),
    episode_number: episodeNumber,
    title: resolveEpisodeTitle(
      [episode.title, currentEpisode?.title],
      episode.episode_number,
    ),
    ...mergeSeasonEpisodeSynopsisFromTmdb(
      episode.synopsis,
      episode.synopsis_en,
      currentEpisode?.synopsis,
      currentEpisode?.synopsis_en,
    ),
    air_date: episode.air_date || currentEpisode?.air_date || "",
    duration_minutes: episode.duration_minutes
      ? String(episode.duration_minutes)
      : currentEpisode?.duration_minutes || current.episode_runtime_minutes,
    still_url: episode.still_url || currentEpisode?.still_url || "",
    source_method: currentEpisode?.source_method || "hls",
    video_url: currentEpisode?.video_url || "",
    embed_url: currentEpisode?.embed_url || "",
    hls_url: currentEpisode?.hls_url || "",
    hls_verified: currentEpisode?.hls_verified ?? false,
    dash_url: currentEpisode?.dash_url || episode.dash_url || "",
    dash_verified: currentEpisode?.dash_verified ?? Boolean(episode.dash_verified),
    download_links: currentEpisode?.download_links ?? {},
    subtitle_url: currentEpisode?.subtitle_url || "",
    dubbed_audio_url: currentEpisode?.dubbed_audio_url || "",
    publish_status: currentEpisode?.publish_status || "draft",
  };
}

export function mergeSeasonDraftFromTmdb(
  season: AdminSeriesSeason,
  currentSeason: SeasonDraft | undefined,
  current: SeriesFormState,
  options?: MergeSeasonFromTmdbOptions,
): SeasonDraft {
  const seasonNumber = String(season.season_number);
  const seasonNumberInt = Number(season.season_number) || 0;
  const currentEpisodesByNumber = new Map(
    (currentSeason?.episodes || []).map((episode) => [
      episode.episode_number.trim(),
      episode,
    ]),
  );
  const tmdbEpisodes = season.episodes.filter((episode) => episode.episode_number > 0);
  const tmdbEpisodesByNumber = new Map(
    tmdbEpisodes.map((episode) => [String(episode.episode_number), episode]),
  );
  const importEpisodeNumbers = new Set(
    (options?.importEpisodeNumbers ?? []).map((number) => String(number)),
  );

  let episodes: EpisodeDraft[];

  if (options?.fullSeasonResync) {
    episodes = tmdbEpisodes
      .filter(
        (episode) =>
          !isTmdbEpisodeExcluded(
            current.tmdb_excluded_episodes,
            seasonNumberInt,
            episode.episode_number,
          ),
      )
      .map((episode) =>
        mergeEpisodeDraftFromTmdb(
          episode,
          currentEpisodesByNumber.get(String(episode.episode_number)),
          current,
        ),
      );
  } else if (currentSeason?.episodes.length) {
    episodes = currentSeason.episodes.map((currentEpisode) => {
      const tmdbEpisode = tmdbEpisodesByNumber.get(currentEpisode.episode_number.trim());

      if (!tmdbEpisode) {
        return currentEpisode;
      }

      return mergeEpisodeDraftFromTmdb(tmdbEpisode, currentEpisode, current);
    });

    if (importEpisodeNumbers.size > 0) {
      for (const episodeNumber of importEpisodeNumbers) {
        if (currentEpisodesByNumber.has(episodeNumber)) {
          continue;
        }

        const tmdbEpisode = tmdbEpisodesByNumber.get(episodeNumber);

        if (
          !tmdbEpisode ||
          isTmdbEpisodeExcluded(
            current.tmdb_excluded_episodes,
            seasonNumberInt,
            Number(episodeNumber),
          )
        ) {
          continue;
        }

        episodes.push(mergeEpisodeDraftFromTmdb(tmdbEpisode, undefined, current));
      }

      episodes.sort(
        (first, second) =>
          (Number(first.episode_number) || 0) - (Number(second.episode_number) || 0),
      );
    }
  } else if (tmdbEpisodes.length > 0) {
    episodes = tmdbEpisodes
      .filter(
        (episode) =>
          !isTmdbEpisodeExcluded(
            current.tmdb_excluded_episodes,
            seasonNumberInt,
            episode.episode_number,
          ),
      )
      .map((episode) => mergeEpisodeDraftFromTmdb(episode, undefined, current));
  } else {
    episodes = currentSeason?.episodes.length
      ? currentSeason.episodes
      : [
          {
            id: uniqueId("episode"),
            episode_number: "1",
            title: "",
            synopsis: "",
            synopsis_en: "",
            air_date: "",
            duration_minutes: "",
            still_url: "",
            source_method: "hls",
            video_url: "",
            embed_url: "",
            hls_url: "",
            hls_verified: false,
            dash_url: "",
            dash_verified: false,
            download_links: {},
            subtitle_url: "",
            dubbed_audio_url: "",
            publish_status: "draft",
          },
        ];
  }

  return {
    id: currentSeason?.id || uniqueId("season"),
    season_number: seasonNumber,
    name: pickNonEmptyText(season.name, currentSeason?.name) || `فصل ${season.season_number}`,
    ...mergeSeasonEpisodeSynopsisFromTmdb(
      season.synopsis,
      season.synopsis_en,
      currentSeason?.synopsis,
      currentSeason?.synopsis_en,
    ),
    air_date: season.air_date || currentSeason?.air_date || "",
    episode_count: season.episode_count
      ? String(season.episode_count)
      : currentSeason?.episode_count || "",
    poster_url: season.poster_url || currentSeason?.poster_url || "",
    hls_base_url: currentSeason?.hls_base_url || "",
    episodes,
  };
}

function applyTmdbSeriesLevelFields(
  current: SeriesFormState,
  payload: TmdbSeriesPayload,
  query: string,
): SeriesFormState {
  return {
    ...current,
    tmdb_query: query,
    tmdb_id: payload.tmdb_id ? String(payload.tmdb_id) : current.tmdb_id,
    imdb_id: payload.imdb_id || "",
    tvdb_id: payload.tvdb_id || "",
    title: payload.title || current.title,
    original_title: payload.original_title || current.original_title,
    slug:
      buildSlug(
        payload.original_title,
        payload.title,
        current.original_title,
        current.title,
        payload.tmdb_id ? `series-${payload.tmdb_id}` : null,
      ) || current.slug,
    ...mergeSeasonEpisodeSynopsisFromTmdb(
      resolveTmdbMainSynopsis(payload),
      payload.synopsis_en,
      current.synopsis,
      current.synopsis_en,
    ),
    first_air_date: payload.first_air_date || current.first_air_date,
    last_air_date: payload.last_air_date || current.last_air_date,
    release_year: payload.release_year ? String(payload.release_year) : current.release_year,
    status: payload.production_status || current.status,
    episode_runtime_minutes:
      typeof payload.episode_runtime_minutes === "number"
        ? String(payload.episode_runtime_minutes)
        : current.episode_runtime_minutes,
    number_of_seasons:
      typeof payload.number_of_seasons === "number"
        ? String(payload.number_of_seasons)
        : current.number_of_seasons,
    number_of_episodes:
      typeof payload.number_of_episodes === "number"
        ? String(payload.number_of_episodes)
        : current.number_of_episodes,
    network: payload.network || current.network,
    provider_name: payload.network || current.provider_name,
    poster_url: payload.poster_url || current.poster_url,
    backdrop_url: payload.backdrop_url || current.backdrop_url,
    trailer_url: payload.trailer_url || current.trailer_url,
    homepage_url: payload.homepage_url || current.homepage_url,
    age_rating: payload.age_rating || current.age_rating,
    rating: typeof payload.rating === "number" ? String(payload.rating) : current.rating,
    popularity:
      typeof payload.popularity === "number" ? String(payload.popularity) : current.popularity,
    vote_count:
      typeof payload.vote_count === "number" ? String(payload.vote_count) : current.vote_count,
    original_language: payload.original_language || current.original_language,
    creators: payload.creators.length
      ? filterLatinPersonNameList(payload.creators)
      : current.creators,
    directors: payload.directors.length
      ? filterLatinPersonNameList(payload.directors)
      : current.directors,
    writers: payload.writers.length
      ? filterLatinPersonNameList(payload.writers)
      : current.writers,
    genres: payload.genres.length ? localizeGenreLabels(payload.genres) : current.genres,
    tags: payload.tags.length ? payload.tags : current.tags,
    languages: payload.languages.length ? payload.languages : current.languages,
    countries: payload.countries.length ? payload.countries : current.countries,
    actors: payload.cast?.length
      ? normalizeActors(
          payload.cast.map((c, idx) => ({
            name: resolveLatinPersonName([c.name]) || null,
            character: c.character || null,
            profile_url: c.profile_url || null,
            tmdb_person_id: c.tmdb_person_id ?? null,
            credit_id: c.credit_id || null,
            order: typeof c.order === "number" ? c.order : idx,
            known_for_department: c.known_for_department || "Acting",
            episode_count: typeof c.episode_count === "number" ? c.episode_count : null,
          })),
        )
      : payload.actors.length
        ? normalizeActors(payload.actors)
        : current.actors,
    crew: payload.crew?.length
      ? payload.crew
          .map((cr) => {
            const name = resolveLatinPersonName([cr.name]);

            if (!name) {
              return null;
            }

            return {
              tmdb_person_id: cr.tmdb_person_id ?? null,
              name,
              job: cr.job || "",
              department: cr.department || "",
              profile_url: cr.profile_url || null,
              credit_id: cr.credit_id || null,
            };
          })
          .filter((row): row is SeriesCrewFormRow => row !== null)
      : current.crew,
  };
}

export function applyTmdbSeriesOverviewToForm(
  current: SeriesFormState,
  payload: TmdbSeriesPayload,
  query: string,
): SeriesFormState {
  return applyTmdbSeriesLevelFields(current, payload, query);
}

export function applyTmdbSeriesToForm(
  current: SeriesFormState,
  payload: TmdbSeriesPayload,
  query: string,
): SeriesFormState {
  const currentSeasonsByNumber = new Map(
    current.seasons.map((season) => [season.season_number.trim(), season]),
  );

  const withSeriesFields = applyTmdbSeriesLevelFields(current, payload, query);

  return {
    ...withSeriesFields,
    tmdb_excluded_season_numbers: [],
    tmdb_excluded_episodes: [],
    seasons:
      payload.seasons.length > 0
        ? payload.seasons
            .filter((season) => season.season_number > 0)
            .map((season) =>
              mergeSeasonDraftFromTmdb(
                season,
                currentSeasonsByNumber.get(String(season.season_number)),
                {
                  ...current,
                  tmdb_excluded_season_numbers: [],
                  tmdb_excluded_episodes: [],
                },
                { fullSeasonResync: true },
              ),
            )
        : current.seasons,
  };
}

export function applyTmdbSeasonToForm(
  current: SeriesFormState,
  season: AdminSeriesSeason,
  options?: MergeSeasonFromTmdbOptions,
): SeriesFormState {
  const seasonNumber = String(season.season_number).trim();
  const currentSeason = current.seasons.find(
    (item) => item.season_number.trim() === seasonNumber,
  );
  const mergedSeason = mergeSeasonDraftFromTmdb(season, currentSeason, current, options);
  const otherSeasons = current.seasons.filter(
    (item) => item.season_number.trim() !== seasonNumber,
  );

  return {
    ...current,
    seasons: [...otherSeasons, mergedSeason].sort(
      (first, second) =>
        (Number(first.season_number) || 0) - (Number(second.season_number) || 0),
    ),
  };
}

export function finalizeTmdbSeriesSyncExclusions(current: SeriesFormState): SeriesFormState {
  return {
    ...current,
    tmdb_excluded_season_numbers: [],
    tmdb_excluded_episodes: [],
  };
}

export function resolveSeasonNumbersForTmdbSync(
  overview: TmdbSeriesPayload,
  excludedSeasonNumbers: number[],
): number[] {
  const fromOverview = overview.season_numbers ?? overview.seasons?.map((s) => s.season_number) ?? [];

  return fromOverview.filter(
    (seasonNumber) =>
      seasonNumber > 0 && !isTmdbSeasonExcluded(excludedSeasonNumbers, seasonNumber),
  );
}
