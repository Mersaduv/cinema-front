const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

export type FilterGenreOption = {
  id: number;
  tmdb_id: number | null;
  name: string;
  slug: string;
  count?: number;
};

export type FilterOptions = {
  catalog_genres?: FilterGenreOption[];
  movie_genres: FilterGenreOption[];
  tv_genres: FilterGenreOption[];
  countries: Array<{ iso: string; name: string; flag?: string | null }>;
  languages: Array<{ iso: string; name: string }>;
  release_years: number[];
  age_ratings: string[];
  content_types: Array<{ value: string; label: string }>;
  sort_options: Array<{ value: string; label: string }>;
  genre_id_aliases?: Record<string, string>;
};

let cachedOptions: FilterOptions | null = null;
let inflight: Promise<FilterOptions> | null = null;

export async function fetchFilterOptions(
  init?: RequestInit,
): Promise<FilterOptions> {
  if (cachedOptions && !init?.cache) {
    return cachedOptions;
  }

  if (!inflight) {
    inflight = requestFilterOptions(init)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("دریافت گزینه‌های فیلتر انجام نشد.");
        }
        const json = (await response.json()) as {
          success: boolean;
          data?: FilterOptions;
        };
        if (!json.success || !json.data) {
          throw new Error("پاسخ فیلتر نامعتبر است.");
        }
        cachedOptions = json.data;
        return json.data;
      })
      .catch((error: unknown) => {
        if (typeof window === "undefined") {
          console.error("Filter options API was unreachable during render.");
          return emptyFilterOptions();
        }
        throw error;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

async function requestFilterOptions(init?: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}/filter-options`;
  const requestInit: RequestInit = {
    headers: { Accept: "application/json" },
    cache: init?.cache ?? "force-cache",
    ...init,
  };

  if (typeof window === "undefined") {
    const { cinemaLoopbackFetch } = await import("./cinema-loopback-fetch");
    return cinemaLoopbackFetch(url, requestInit);
  }

  return fetch(url, requestInit);
}

function emptyFilterOptions(): FilterOptions {
  return {
    movie_genres: [],
    tv_genres: [],
    countries: [],
    languages: [],
    release_years: [],
    age_ratings: [],
    content_types: [],
    sort_options: [],
  };
}

export function clearFilterOptionsCache(): void {
  cachedOptions = null;
}
