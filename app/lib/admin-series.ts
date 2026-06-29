import { apiClient, type ApiResponse } from "./api";
import type { ResponsiveImageAsset } from "./cinema-image";
import { cleanPayload, logPayloadSize } from "./clean-payload";

export type SeriesPublishStatus = "draft" | "scheduled" | "published";
export type SeriesPipelineStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface AdminSeriesActor {
  name: string | null;
  character: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
  tmdb_person_id?: number | null;
  credit_id?: string | null;
  order?: number | null;
  known_for_department?: string | null;
  episode_count?: number | null;
}

export type AdminSeriesCastPayload = {
  tmdb_person_id?: number | null;
  name: string;
  character: string;
  profile_url?: string | null;
  profile_image?: ResponsiveImageAsset | null;
  credit_id?: string | null;
  order?: number;
  known_for_department?: string;
  episode_count?: number;
};

export type AdminSeriesCrewPayload = {
  tmdb_person_id?: number | null;
  name: string;
  job: string;
  department: string;
  profile_url?: string | null;
  profile_image?: ResponsiveImageAsset | null;
  credit_id?: string | null;
};

export interface AdminSeriesEpisode {
  id?: number;
  season_number: number;
  episode_number: number;
  title: string;
  slug?: string;
  synopsis?: string | null;
  synopsis_en?: string | null;
  air_date?: string | null;
  duration_minutes?: number | null;
  still_url?: string | null;
  still_image?: ResponsiveImageAsset | null;
  source_method?: "upload" | "embed" | "url" | "hls";
  video_url?: string | null;
  embed_url?: string | null;
  hls_url?: string | null;
  hls_verified?: boolean;
  dash_url?: string | null;
  dash_verified?: boolean;
  download_links?: Record<string, string>;
  subtitle_url?: string | null;
  dubbed_audio_url?: string | null;
  publish_status?: SeriesPublishStatus;
}

export interface AdminSeriesSeason {
  id?: number;
  season_number: number;
  name?: string | null;
  synopsis?: string | null;
  synopsis_en?: string | null;
  air_date?: string | null;
  episode_count?: number | null;
  poster_url?: string | null;
  poster_image?: ResponsiveImageAsset | null;
  hls_base_url?: string | null;
  episodes: AdminSeriesEpisode[];
}

export interface AdminSeries {
  id: number;
  title: string;
  slug: string;
  original_title: string | null;
  synopsis: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  release_year: number | null;
  status: string | null;
  show_type: string | null;
  episode_runtime_minutes: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  seasons_count: number;
  episodes_count: number;
  network: string | null;
  provider_name: string | null;
  poster_url: string | null;
  poster_image?: ResponsiveImageAsset | null;
  backdrop_url: string | null;
  backdrop_image?: ResponsiveImageAsset | null;
  trailer_url: string | null;
  homepage_url: string | null;
  hls_base_url: string | null;
  age_rating: string | null;
  has_subtitle: boolean;
  has_dubbed: boolean;
  drm_scheme?: string | null;
  drm_license_url?: string | null;
  catalog_visibility: string;
  is_featured: boolean;
  exclude_from_slider?: boolean;
  publish_status: SeriesPublishStatus;
  pipeline_status?: SeriesPipelineStatus;
  scheduled_for: string | null;
  published_at: string | null;
  metadata: {
    tmdb: {
      query: string | null;
      tmdb_id: number | null;
      imdb_id: string | null;
      tvdb_id: string | null;
      rating: number | null;
      popularity?: number | null;
      vote_count?: number | null;
      original_language: string | null;
      episode_runtime_minutes: number | null;
      creators: string[];
      directors: string[];
      writers: string[];
      genres: string[];
      tags: string[];
      languages: string[];
      countries: string[];
      actors: AdminSeriesActor[];
      synopsis_en?: string | null;
      poster_url?: string | null;
      poster_source_url?: string | null;
      backdrop_url?: string | null;
      backdrop_source_url?: string | null;
      exclusions?: {
        season_numbers?: number[];
        episodes?: Array<{ season_number: number; episode_number: number }>;
      };
    };
    wordpress: {
      catalog_visibility: string;
      is_featured: boolean;
      tv_show_style: string;
      episode_methods: string[];
    };
    seo?: {
      meta_title?: string | null;
      meta_description?: string | null;
    };
    content_warnings?: string[];
    quality_badges?: string[];
    admin_notes?: string | null;
  };
  admin_notes?: string | null;
  has_admin_notes?: boolean;
  seasons?: AdminSeriesSeason[];
  created_at: string | null;
  updated_at: string | null;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  cast?: AdminSeriesCastPayload[];
  crew?: AdminSeriesCrewPayload[];
}

export interface TmdbSeriesPayload {
  tmdb_id: number | null;
  tmdb_query: string;
  imdb_id: string | null;
  tvdb_id: string | null;
  title: string | null;
  original_title: string | null;
  original_language: string | null;
  synopsis: string | null;
  synopsis_en?: string | null;
  overview?: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  genres: string[];
  tags: string[];
  languages: string[];
  countries: string[];
  release_year: number | null;
  first_air_date: string | null;
  last_air_date: string | null;
  rating: number | null;
  popularity?: number | null;
  vote_count?: number | null;
  age_rating: string | null;
  episode_runtime_minutes: number | null;
  creators: string[];
  directors: string[];
  writers: string[];
  production_status: string | null;
  show_type: string | null;
  network: string | null;
  homepage_url: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  actors: AdminSeriesActor[];
  cast?: AdminSeriesCastPayload[];
  crew?: AdminSeriesCrewPayload[];
  season_numbers?: number[];
  seasons: AdminSeriesSeason[];
}

export type FetchTmdbSeriesOptions = {
  language?: string;
  includeSeasons?: boolean;
  signal?: AbortSignal;
};

export interface AdminSeriesSummary {
  total: number;
  drafts: number;
  scheduled: number;
  published: number;
  featured: number;
}

export interface AdminSeriesPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminSeriesListResponse {
  series: AdminSeries[];
  summary: AdminSeriesSummary;
  pagination: AdminSeriesPagination;
}

export interface AdminSeriesOptionsResponse {
  publish_statuses: Array<{ value: SeriesPublishStatus; label: string }>;
  production_statuses: Array<{ value: string; label: string }>;
  show_types: Array<{ value: string; label: string }>;
  catalog_visibility: Array<{ value: string; label: string }>;
}

export interface AdminSeriesPayload {
  title: string;
  slug?: string;
  original_title?: string;
  synopsis?: string;
  synopsis_en?: string | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  release_year?: number | null;
  status?: string;
  show_type?: string;
  episode_runtime_minutes?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  network?: string;
  provider_name?: string;
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  homepage_url?: string;
  hls_base_url?: string;
  age_rating?: string;
  catalog_visibility?: string;
  is_featured?: boolean;
  exclude_from_slider?: boolean;
  publish_status?: SeriesPublishStatus;
  scheduled_for?: string | null;
  tmdb_query?: string;
  tmdb_id?: number | null;
  imdb_id?: string;
  tvdb_id?: string;
  meta_title?: string;
  meta_description?: string;
  content_warnings?: string[];
  quality_badges?: string[];
  rating?: number | null;
  popularity?: number | null;
  vote_count?: number | null;
  original_language?: string;
  creators?: string[];
  directors?: string[];
  writers?: string[];
  genres?: string[];
  tags?: string[];
  languages?: string[];
  countries?: string[];
  actors?: AdminSeriesActor[];
  cast?: AdminSeriesCastPayload[];
  crew?: AdminSeriesCrewPayload[];
  drm_scheme?: string;
  drm_license_url?: string | null;
  seasons?: AdminSeriesSeason[];
  tmdb_excluded_season_numbers?: number[];
  tmdb_excluded_episodes?: Array<{ season_number: number; episode_number: number }>;
  admin_notes?: string | null;
}

export const adminSeriesService = {
  async list(params: {
    search?: string;
    publish_status?: string;
    status?: string;
    include_seasons?: boolean;
    include_episodes?: boolean;
    page?: number;
  }): Promise<ApiResponse<AdminSeriesListResponse>> {
    const query = new URLSearchParams();

    if (params.search) {
      query.set("search", params.search);
    }
    if (params.publish_status) {
      query.set("publish_status", params.publish_status);
    }
    if (params.status) {
      query.set("status", params.status);
    }
    if (params.include_seasons) {
      query.set("include_seasons", "1");
    }
    if (params.include_episodes) {
      query.set("include_episodes", "1");
    }
    if (params.page) {
      query.set("page", String(params.page));
    }

    return apiClient.get<AdminSeriesListResponse>(
      `/admin/series${query.toString() ? `?${query.toString()}` : ""}`,
    );
  },

  async options(): Promise<ApiResponse<AdminSeriesOptionsResponse>> {
    return apiClient.get<AdminSeriesOptionsResponse>("/admin/series/options");
  },

  async create(payload: AdminSeriesPayload) {
    const cleaned = cleanPayload(payload) as AdminSeriesPayload;
    logPayloadSize("series.create", payload, cleaned);

    return apiClient.post<{ series: AdminSeries }>("/admin/series", cleaned, {
      timeoutMs: 60_000,
    });
  },

  async show(seriesId: string | number) {
    return apiClient.get<{ series: AdminSeries }>(`/admin/series/${seriesId}`);
  },

  async searchTmdb(query: string, language = "fa-IR") {
    const params = new URLSearchParams({ query, language, type: "tv" });

    return apiClient.get<{ results: import("./admin-movies").TmdbSearchResult[] }>(
      `/admin/tmdb/search?${params.toString()}`,
    );
  },

  async checkSlug(slug: string, excludeId?: string | number) {
    const params = new URLSearchParams({ slug });

    if (excludeId !== undefined && excludeId !== "") {
      params.set("exclude_id", String(excludeId));
    }

    return apiClient.get<{ available: boolean; suggestion?: string | null }>(
      `/admin/series/check-slug?${params.toString()}`,
    );
  },

  async fetchTmdb(
    tmdbId: string | number,
    options: FetchTmdbSeriesOptions = {},
  ) {
    const params = new URLSearchParams({
      tmdb_id: String(tmdbId),
      language: options.language ?? "fa-IR",
    });

    if (options.includeSeasons === false) {
      params.set("include_seasons", "0");
    }

    return apiClient.get<{ series: TmdbSeriesPayload }>(
      `/admin/tmdb/tv/fetch?${params.toString()}`,
      { signal: options.signal },
    );
  },

  async ingestTmdbImages(
    payload: import("./admin-tmdb-image-ingest").IngestTmdbImagesPayload,
    options: { signal?: AbortSignal } = {},
  ) {
    return apiClient.post<import("./admin-tmdb-image-ingest").IngestTmdbImagesResult>(
      "/admin/series/ingest-tmdb-images",
      payload,
      { signal: options.signal, timeoutMs: 120_000 },
    );
  },

  async fetchTmdbSeason(
    tmdbId: string | number,
    seasonNumber: string | number,
    options: { language?: string; signal?: AbortSignal } = {},
  ) {
    const params = new URLSearchParams({
      tmdb_id: String(tmdbId),
      season_number: String(seasonNumber),
      language: options.language ?? "fa-IR",
    });

    return apiClient.get<{ season: AdminSeriesSeason }>(
      `/admin/tmdb/tv/season/fetch?${params.toString()}`,
      { signal: options.signal },
    );
  },

  async update(seriesId: string | number, payload: AdminSeriesPayload) {
    const cleaned = cleanPayload(payload) as AdminSeriesPayload;
    logPayloadSize("series.update", payload, cleaned);

    return apiClient.put<{ series: AdminSeries }>(`/admin/series/${seriesId}`, cleaned, {
      timeoutMs: 60_000,
    });
  },

  async updatePublishStatus(
    seriesId: string | number,
    payload: { publish_status: SeriesPublishStatus; scheduled_for?: string | null },
  ) {
    return apiClient.put<{ series: AdminSeries }>(
      `/admin/series/${seriesId}/publish-status`,
      payload,
    );
  },

  async upsertEpisode(
    seriesId: string | number,
    seasonNumber: number,
    episodeNumber: number,
    payload: AdminSeriesEpisode & {
      season?: {
        hls_base_url?: string | null;
        name?: string | null;
      };
    },
  ) {
    const cleaned = cleanPayload(payload);

    return apiClient.patch<{
      episode: AdminSeriesEpisode;
      series: AdminSeries;
    }>(
      `/admin/series/${seriesId}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
      cleaned,
      { timeoutMs: 30_000 },
    );
  },

  async getPreviewToken(seriesId: string | number) {
    return apiClient.get<{ token: string; expires_at: string }>(
      `/admin/series/${seriesId}/preview-token`,
    );
  },

  async getHistory(seriesId: string | number, page = 1) {
    const params = new URLSearchParams({ page: String(page) });

    return apiClient.get<{
      history: import("./content-change-history").ContentChangeLogEntry[];
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>(`/admin/series/${seriesId}/history?${params.toString()}`);
  },

  async remove(seriesId: string | number) {
    return apiClient.delete<{
      deleted_series: {
        title: string;
        slug: string;
      };
    }>(`/admin/series/${seriesId}`);
  },
};
