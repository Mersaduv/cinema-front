export function adminCreateMovieHref(): string {
  return `/admin/content-management/movies/add?fresh=${Date.now()}`;
}

export function adminCreateSeriesHref(): string {
  return `/admin/content-management/series/add?fresh=${Date.now()}`;
}
