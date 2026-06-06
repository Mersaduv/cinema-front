import { apiClient, type ApiResponse } from "./api";

export interface PersonDetail {
  id: number;
  name: string;
  slug: string;
  biography: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string | null;
  gender: number | null;
  profile_url: string | null;
  imdb_id: string | null;
  stats: {
    movies_count: number;
    series_count: number;
    movies_on_platform: number;
    series_on_platform: number;
  };
  cast_in_movies: Array<{
    movie_id: number;
    title: string;
    slug: string;
    release_year: number | null;
    character: string | null;
    poster_url: string | null;
    cast_order: number;
  }>;
  cast_in_series: Array<{
    series_id: number;
    title: string;
    slug: string;
    release_year: number | null;
    character: string | null;
    poster_url: string | null;
    cast_order: number;
  }>;
  directing: Array<{
    kind: string;
    title: string;
    slug: string;
    release_year: number | null;
    job: string | null;
    poster_url: string | null;
  }>;
  writing: Array<{
    kind: string;
    title: string;
    slug: string;
    release_year: number | null;
    job: string | null;
    poster_url: string | null;
  }>;
  producing: Array<{
    kind: string;
    title: string;
    slug: string;
    release_year: number | null;
    job: string | null;
    poster_url: string | null;
  }>;
}

export const personsService = {
  async fetchBySlug(slug: string): Promise<ApiResponse<{ person: PersonDetail }>> {
    return apiClient.get<{ person: PersonDetail }>(`/persons/${encodeURIComponent(slug)}`);
  },
};
