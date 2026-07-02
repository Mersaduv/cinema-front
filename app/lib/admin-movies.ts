import { apiClient, type ApiResponse } from "./api";
import type { ResponsiveImageAsset } from "./cinema-image";

export type PublishStatus = "draft" | "scheduled" | "published";
export type PipelineStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed";
export type ProcessingStatus =
  | "pending"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export interface AdminMovieVariant {
  id: number;
  profile_key: string;
  resolution: string;
  bandwidth: number;
  playlist_relative_path: string;
  playlist_url: string | null;
  codecs: string | null;
  is_active: boolean;
}

export interface AdminMovieProcessingRun {
  id: number;
  status: string;
  progress_percent: number | null;
  eta_seconds: number | null;
  current_profile_key: string | null;
  source_duration_seconds: number | null;
  error_message: string | null;
  ffmpeg_command: string | null;
  logs: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface AdminMovieMediaAsset {
  id: number;
  kind: string;
  source_path: string;
  source_is_external: boolean;
  managed_relative_directory: string | null;
  hls_output_relative_directory: string | null;
  master_playlist_relative_path: string;
  selected_hls_profiles: string[];
  master_playlist_url: string | null;
  processing_status: ProcessingStatus;
  processing_progress_percent: number | null;
  processing_eta_seconds: number | null;
  current_profile_key: string | null;
  processing_started_at: string | null;
  processing_error: string | null;
  last_processed_at: string | null;
  variants: AdminMovieVariant[];
  processing_runs?: AdminMovieProcessingRun[];
}

export interface AdminMovieMetadata {
  tmdb: {
    query: string | null;
    tmdb_id: number | null;
    imdb_id: string | null;
    homepage_url?: string | null;
    poster_url: string | null;
    poster_source_url?: string | null;
    backdrop_url: string | null;
    backdrop_source_url?: string | null;
    trailer_url: string | null;
    rating: number | null;
    popularity?: number | null;
    vote_count?: number | null;
    original_language: string | null;
    runtime_minutes: number | null;
    directors: string[];
    writers: string[];
    production_status: string | null;
    budget: number | null;
    revenue: number | null;
    genres: string[];
    tags: string[];
    languages: string[];
    countries: string[];
    actors: TmdbActor[];
    synopsis_en?: string | null;
    belongs_to_collection?: TmdbBelongsToCollection | null;
  };
  playback: {
    hls_url: string | null;
    dash_url?: string | null;
    downloads: Record<string, string>;
  };
  seo?: {
    meta_title?: string | null;
    meta_description?: string | null;
  };
  content_warnings?: string[];
  quality_badges?: string[];
  admin_notes?: string | null;
}

export interface AdminMovie {
  id: number;
  title: string;
  slug: string;
  tmdb_id?: number | null;
  original_title: string | null;
  synopsis: string | null;
  release_year: number | null;
  duration_seconds: number | null;
  provider_name: string | null;
  poster_path: string | null;
  poster_url: string | null;
  poster_image?: ResponsiveImageAsset | null;
  backdrop_url?: string | null;
  backdrop_image?: ResponsiveImageAsset | null;
  trailer_path: string | null;
  trailer_url: string | null;
  has_dubbed_audio: boolean;
  dubbed_source_path: string | null;
  dubbed_source_url: string | null;
  audio_tracks: Array<{
    label: string;
    language: string;
    source_path: string | null;
    source_url: string | null;
  }>;
  has_subtitle: boolean;
  subtitle_source_path: string | null;
  subtitle_source_url: string | null;
  drm_scheme?: string | null;
  drm_license_url?: string | null;
  is_featured?: boolean;
  exclude_from_slider?: boolean;
  catalog_visibility?: string;
  age_rating: string | null;
  cast_members: string[];
  publish_status: PublishStatus;
  pipeline_status?: PipelineStatus;
  processing_status: ProcessingStatus;
  processing_error: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  media_folder: string | null;
  metadata: AdminMovieMetadata;
  created_at: string | null;
  updated_at: string | null;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  admin_notes?: string | null;
  has_admin_notes?: boolean;
  publish_completion_pending?: boolean;
  media_asset: AdminMovieMediaAsset | null;
  /** Loaded on detail when credits are synced */
  cast?: MovieCastApiRow[];
  crew?: MovieCrewApiRow[];
}

export interface AdminMoviesSummary {
  total: number;
  drafts: number;
  published: number;
  processing: number;
  ready: number;
}

export interface AdminMoviesPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminMoviesResponse {
  movies: AdminMovie[];
  summary: AdminMoviesSummary;
  pagination: AdminMoviesPagination;
}

export interface AdminMovieOptionsResponse {
  publish_statuses: Array<{
    value: PublishStatus;
    label: string;
  }>;
  processing_statuses: Array<{
    value: ProcessingStatus;
    label: string;
  }>;
  hls_profiles: Array<{
    key: string;
    label: string;
    resolution: string;
    bandwidth: number;
  }>;
  upload_limits?: {
    upload_max_filesize: string | null;
    post_max_size: string | null;
    max_execution_time: string | null;
    max_input_time: string | null;
  };
  genres?: Array<{
    id: number;
    tmdb_id: number | null;
    name: string;
    slug: string;
  }>;
  countries?: Array<{
    iso: string;
    name: string;
    flag?: string | null;
  }>;
  languages?: Array<{
    iso: string;
    name: string;
  }>;
  catalog_visibility?: Array<{
    value: string;
    label: string;
  }>;
}

export interface CreateAdminMoviePayload {
  title?: string;
  slug?: string;
  original_title: string;
  release_year?: number | null;
  provider_name?: string;
  has_dubbed_audio?: boolean;
  dubbed_source_path?: string;
  audio_tracks?: Array<{
    label: string;
    language?: string;
    source_path: string;
  }>;
  has_subtitle?: boolean;
  subtitle_source_path?: string;
}

export interface UpdateAdminMovieDraftPayload {
  title: string;
  original_title: string;
  slug: string;
  release_year?: number | null;
  provider_name?: string;
  source_path?: string;
  poster_path?: string;
  trailer_path?: string;
  has_dubbed_audio?: boolean;
  dubbed_source_path?: string;
  audio_tracks?: Array<{
    label: string;
    language?: string;
    source_path: string;
  }>;
  has_subtitle?: boolean;
  subtitle_source_path?: string;
  synopsis?: string;
  age_rating?: string;
}

export interface TmdbActor {
  name: string | null;
  character: string | null;
  profile_url: string | null;
  tmdb_person_id?: number | null;
  credit_id?: string | null;
  order?: number | null;
  known_for_department?: string | null;
}

export interface TmdbCastMember {
  tmdb_person_id: number;
  name: string;
  character: string;
  profile_url: string | null;
  credit_id: string;
  order: number;
  known_for_department: string;
}

export interface TmdbCrewMember {
  tmdb_person_id: number;
  name: string;
  job: string;
  department: string;
  profile_url: string | null;
  credit_id: string;
}

export interface UpdateMoviePublicationPayload {
  title: string;
  slug: string;
  original_title?: string;
  poster_path?: string;
  poster_url?: string;
  trailer_path?: string;
  trailer_url?: string;
  backdrop_url?: string;
  synopsis?: string;
  age_rating?: string;
  release_year?: number | null;
  tmdb_id?: number;
  imdb_id?: string;
  tmdb_query?: string;
  rating?: number | null;
  original_language?: string | null;
  runtime_minutes?: number | null;
  directors?: string[];
  writers?: string[];
  production_status?: string | null;
  budget?: number | null;
  revenue?: number | null;
  genres?: string[];
  tags?: string[];
  languages?: string[];
  countries?: string[];
  actors?: TmdbActor[];
  cast?: MovieCastApiRow[];
  crew?: MovieCrewApiRow[];
  hls_url?: string;
  download_links?: Record<string, string>;
  subtitle_source_path?: string;
  cast_members?: string[];
}

export interface TmdbSearchResult {
  tmdb_id: number;
  title: string | null;
  original_title: string | null;
  synopsis: string | null;
  synopsis_en?: string | null;
  overview?: string | null;
  release_year: number | null;
  rating: number | null;
  popularity?: number | null;
  vote_count?: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
}

export type TmdbBelongsToCollection = {
  tmdb_collection_id: number;
  name: string;
  poster_url?: string | null;
  backdrop_url?: string | null;
};

export interface TmdbMoviePayload extends TmdbSearchResult {
  imdb_id: string | null;
  homepage_url?: string | null;
  original_language: string | null;
  trailer_url: string | null;
  genres: string[];
  tags: string[];
  languages: string[];
  countries: string[];
  age_rating: string | null;
  runtime_minutes: number | null;
  directors: string[];
  writers: string[];
  production_status: string | null;
  budget: number | null;
  revenue: number | null;
  production_companies?: Array<{ name?: string | null }>;
  cast_members: string[];
  actors: TmdbActor[];
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
  belongs_to_collection?: TmdbBelongsToCollection | null;
}

export interface MovieCastApiRow {
  tmdb_person_id?: number | null;
  person_id?: number;
  name: string | null;
  character: string | null;
  profile_url: string | null;
  credit_id?: string | null;
  order?: number;
  known_for_department?: string | null;
  slug?: string | null;
}

export interface MovieCrewApiRow {
  tmdb_person_id?: number | null;
  person_id?: number;
  name: string | null;
  job: string | null;
  department: string | null;
  profile_url: string | null;
  credit_id?: string | null;
  slug?: string | null;
}

export interface HlsPackagePreviewData {
  canonical_hls_url: string;
  subtitle_source_url: string | null;
  dubbed_audio_url: string | null;
  /** Always empty; download URLs are entered manually in the publication form. */
  download_links?: Record<string, string>;
  has_subtitle: boolean;
  has_dubbed_audio: boolean;
  dash_url?: string | null;
  dash_verified?: boolean;
  audio_tracks: Array<{
    label: string;
    language: string;
    source_url: string | null;
  }>;
}

export function unwrapHlsPackagePreview(
  response: ApiResponse<HlsPackagePreviewData>,
): HlsPackagePreviewData | null {
  if (!response.success) {
    return null;
  }

  const payload = response.data;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("canonical_hls_url" in payload) {
    return payload;
  }

  const nested = (payload as { data?: HlsPackagePreviewData }).data;

  return nested ?? null;
}

export interface CreateAdminMovieUploadPayload {
  title: string;
  slug?: string;
  original_title?: string;
  synopsis?: string;
  release_year?: number | null;
  duration_seconds?: number | null;
  provider_name?: string;
  publish_status: PublishStatus;
  scheduled_for?: string | null;
  source_file: File;
  poster_file?: File | null;
}

let optionsCache: AdminMovieOptionsResponse | null = null;
let optionsFetchedAt = 0;

export async function getAdminMovieOptions(): Promise<AdminMovieOptionsResponse> {
  const ttlMs = 24 * 60 * 60 * 1000;

  if (optionsCache && Date.now() - optionsFetchedAt < ttlMs) {
    return optionsCache;
  }

  const response = await adminMoviesService.options();

  if (response.success && response.data) {
    optionsCache = response.data;
    optionsFetchedAt = Date.now();
    return optionsCache;
  }

  return optionsCache ?? {
    publish_statuses: [],
    processing_statuses: [],
    hls_profiles: [],
  };
}

export const adminMoviesService = {
  async list(params: {
    search?: string;
    publish_status?: string;
    genre_ids?: string[];
    countries?: string[];
    languages?: string[];
    year_from?: number | null;
    year_to?: number | null;
    min_rating?: string;
    sort?: string;
    catalog_visibility?: string;
    slider?: string;
    page?: number;
  }): Promise<ApiResponse<AdminMoviesResponse>> {
    const query = new URLSearchParams();

    if (params.search) {
      query.set("search", params.search);
    }
    if (params.publish_status) {
      query.set("publish_status", params.publish_status);
    }
    if (params.genre_ids?.length) query.set("genre_ids", params.genre_ids.join(","));
    if (params.countries?.length) query.set("countries", params.countries.join(","));
    if (params.languages?.length) query.set("languages", params.languages.join(","));
    if (params.year_from) query.set("year_from", String(params.year_from));
    if (params.year_to) query.set("year_to", String(params.year_to));
    if (params.min_rating) query.set("min_rating", params.min_rating);
    if (params.sort) query.set("sort", params.sort);
    if (params.catalog_visibility) query.set("catalog_visibility", params.catalog_visibility);
    if (params.slider) query.set("slider", params.slider);
    if (params.page) {
      query.set("page", String(params.page));
    }

    const endpoint = `/admin/movies${query.toString() ? `?${query.toString()}` : ""}`;

    return apiClient.get<AdminMoviesResponse>(endpoint);
  },

  async options(): Promise<ApiResponse<AdminMovieOptionsResponse>> {
    return apiClient.get<AdminMovieOptionsResponse>("/admin/movies/options");
  },

  async create(payload: CreateAdminMoviePayload | CreateAdminMovieUploadPayload) {
    if ("source_file" in payload) {
      const formData = new FormData();
      formData.append("title", payload.title);

      if (payload.slug) {
        formData.append("slug", payload.slug);
      }
      if (payload.original_title) {
        formData.append("original_title", payload.original_title);
      }
      if (payload.synopsis) {
        formData.append("synopsis", payload.synopsis);
      }
      if (typeof payload.release_year === "number") {
        formData.append("release_year", String(payload.release_year));
      }
      if (typeof payload.duration_seconds === "number") {
        formData.append("duration_seconds", String(payload.duration_seconds));
      }
      if (payload.provider_name) {
        formData.append("provider_name", payload.provider_name);
      }

      formData.append("publish_status", payload.publish_status);
      formData.append("source_file", payload.source_file);

      if (payload.scheduled_for) {
        formData.append("scheduled_for", payload.scheduled_for);
      }
      if (payload.poster_file) {
        formData.append("poster_file", payload.poster_file);
      }

      return apiClient.postForm<{ movie: AdminMovie }>("/admin/movies", formData);
    }

    return apiClient.post<{ movie: AdminMovie }>("/admin/movies", payload);
  },

  async show(movieId: string | number) {
    return apiClient.get<{ movie: AdminMovie }>(`/admin/movies/${movieId}`);
  },

  async pollUntilProcessingSettles(
    movieId: string | number,
    options?: { intervalMs?: number; maxWait?: number; timeoutMs?: number },
  ): Promise<AdminMovie | null> {
    const intervalMs = options?.intervalMs ?? 800;
    const maxWait = options?.maxWait ?? options?.timeoutMs ?? 15_000;
    const startedAt = Date.now();
    let lastMovie: AdminMovie | null = null;

    while (Date.now() - startedAt < maxWait) {
      const response = await this.show(movieId);

      if (response.success && response.data?.movie) {
        lastMovie = response.data.movie;

        if (lastMovie.processing_status === "ready" || lastMovie.processing_status === "failed") {
          return lastMovie;
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
    }

    return lastMovie;
  },

  async previewHlsPackage(
    hlsUrl: string,
    options?: { resolveDownloads?: boolean },
  ) {
    const resolveDownloads = options?.resolveDownloads ?? false;

    return apiClient.post<HlsPackagePreviewData>(
      "/admin/movies/preview-hls-package",
      {
        hls_url: hlsUrl,
        resolve_downloads: resolveDownloads,
      },
      { timeoutMs: resolveDownloads ? 90_000 : 25_000 },
    );
  },

  async checkHlsExists(
    baseUrl: string,
    episodes: Array<{ season: number; episode: number }>,
  ) {
    return apiClient.post<Array<{ season: number; episode: number; exists: boolean }>>(
      "/admin/movies/check-hls-exists",
      { base_url: baseUrl, episodes },
    );
  },

  async updatePublishStatus(
    movieId: string | number,
    payload: {
      publish_status: PublishStatus;
      scheduled_for?: string | null;
    },
    options?: { idempotencyKey?: string },
  ) {
    const headers: Record<string, string> = {};

    if (options?.idempotencyKey) {
      headers["X-Idempotency-Key"] = options.idempotencyKey;
    }

    return apiClient.put<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/publish-status`,
      payload,
      { headers },
    );
  },

  async getPreviewToken(movieId: string | number) {
    return apiClient.get<{ token: string; expires_at: string }>(
      `/admin/movies/${movieId}/preview-token`,
    );
  },

  async getHistory(movieId: string | number, page = 1) {
    const params = new URLSearchParams({ page: String(page) });

    return apiClient.get<{
      history: import("./content-change-history").ContentChangeLogEntry[];
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>(`/admin/movies/${movieId}/history?${params.toString()}`);
  },

  async updatePublicationForm(
    movieId: string | number,
    payload: UpdateMoviePublicationPayload
  ) {
    return apiClient.put<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/publication-form`,
      payload
    );
  },

  async updatePublicationFormWithFiles(
    movieId: string | number,
    formData: FormData
  ) {
    formData.set("_method", "PUT");

    return apiClient.postForm<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/publication-form`,
      formData
    );
  },

  async searchTmdb(query: string, language = "fa-IR", type: "movie" | "tv" = "movie") {
    const params = new URLSearchParams({ query, language, type });

    return apiClient.get<{ results: TmdbSearchResult[] }>(
      `/admin/tmdb/search?${params.toString()}`
    );
  },

  async checkSlug(slug: string, excludeId?: string | number) {
    const params = new URLSearchParams({ slug });

    if (excludeId !== undefined && excludeId !== "") {
      params.set("exclude_id", String(excludeId));
    }

    return apiClient.get<{ available: boolean; suggestion?: string | null }>(
      `/admin/movies/check-slug?${params.toString()}`,
    );
  },

  async fetchTmdb(tmdbId: string | number, language = "fa-IR") {
    const params = new URLSearchParams({
      tmdb_id: String(tmdbId),
      language,
    });

    return apiClient.get<{ movie: TmdbMoviePayload }>(
      `/admin/tmdb/fetch?${params.toString()}`
    );
  },

  async ingestTmdbImages(
    payload: import("./admin-tmdb-image-ingest").IngestTmdbImagesPayload,
    options: { signal?: AbortSignal } = {},
  ) {
    return apiClient.post<import("./admin-tmdb-image-ingest").IngestTmdbImagesResult>(
      "/admin/movies/ingest-tmdb-images",
      payload,
      { signal: options.signal, timeoutMs: 120_000 },
    );
  },

  async updateDraftForm(
    movieId: string | number,
    payload: UpdateAdminMovieDraftPayload
  ) {
    return apiClient.put<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/draft-form`,
      payload
    );
  },

  async remove(movieId: string | number) {
    return apiClient.delete<{
      deleted_movie: {
        title: string;
        slug: string;
      };
    }>(`/admin/movies/${movieId}`);
  },
};

export type HlsEpisodeExistsRow = {
  season: number;
  episode: number;
  exists: boolean;
  hls_url?: string | null;
};

export function unwrapCheckHlsExistsItems(
  response: ApiResponse<HlsEpisodeExistsRow[]>,
): HlsEpisodeExistsRow[] {
  if (!response.success) {
    return [];
  }

  const payload = response.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: HlsEpisodeExistsRow[] }).data;
  }

  return [];
}
