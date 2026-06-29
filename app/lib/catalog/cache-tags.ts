/** Next.js `"use cache"` tags for public catalog + home routes. Keep in sync with backend NextPublicCacheRevalidationService. */
export const VIEWER_CACHE_TAGS = [
  "home-critical",
  "home-rails",
  "catalog",
  "catalog-movies",
  "catalog-series",
] as const;

export const VIEWER_REVALIDATE_PATHS = [
  "/",
  "/movies",
  "/series",
  "/collections",
  "/animation",
  "/search",
] as const satisfies readonly string[];
