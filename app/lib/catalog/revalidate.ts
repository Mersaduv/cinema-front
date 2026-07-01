"use client";

import { mutate } from "swr";
import { tokenStorage } from "../auth";
import { VIEWER_CACHE_TAGS, VIEWER_REVALIDATE_PATHS } from "./cache-tags";

function uniqueSlugs(...slugs: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(slugs.map((slug) => slug?.trim()).filter((slug): slug is string => Boolean(slug))),
  );
}

function buildRevalidatePaths(options?: {
  movieSlugs?: string[];
  seriesSlugs?: string[];
}): string[] {
  const paths: string[] = [...VIEWER_REVALIDATE_PATHS];

  for (const slug of options?.movieSlugs ?? []) {
    paths.push(`/movies/${slug}`);
  }

  for (const slug of options?.seriesSlugs ?? []) {
    paths.push(`/series/${slug}`);
  }

  return Array.from(new Set(paths));
}

async function revalidateViewerNextCache(options?: {
  movieSlugs?: string[];
  seriesSlugs?: string[];
}): Promise<boolean> {
  const token = tokenStorage.getToken();

  if (!token) {
    return false;
  }

  try {
    const response = await fetch("/api/admin/revalidate-viewer", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paths: buildRevalidatePaths(options),
        tags: [...VIEWER_CACHE_TAGS],
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function revalidatePublicMoviesCatalog(): Promise<unknown[]> {
  return mutate(
    (key) =>
      typeof key === "string" &&
      key.startsWith("movie:") &&
      !key.startsWith("movie:detail:"),
    undefined,
    { revalidate: true },
  );
}

export function revalidatePublicSeriesCatalog(): Promise<unknown[]> {
  return mutate(
    (key) =>
      typeof key === "string" &&
      key.startsWith("series:") &&
      !key.startsWith("series:detail:"),
    undefined,
    { revalidate: true },
  );
}

export function revalidatePublicHomeGenreRails(): Promise<unknown[]> {
  return mutate(
    (key) => Array.isArray(key) && key[0] === "genre-rail",
    undefined,
    { revalidate: true },
  );
}

export function revalidatePublicMovieDetail(slug: string): Promise<unknown> {
  const normalized = slug.trim();
  if (!normalized) {
    return Promise.resolve(undefined);
  }

  return mutate(`movie:detail:${normalized}`, undefined, { revalidate: true });
}

export function revalidatePublicSeriesDetail(slug: string): Promise<unknown> {
  const normalized = slug.trim();
  if (!normalized) {
    return Promise.resolve(undefined);
  }

  return mutate(`series:detail:${normalized}`, undefined, { revalidate: true });
}

export function revalidatePublicAnimationCatalog(): Promise<unknown[]> {
  return mutate(
    (key) => typeof key === "string" && key.startsWith("animation:"),
    undefined,
    { revalidate: true },
  );
}

function revalidatePublicCatalogClientCaches(): Promise<unknown[]> {
  return Promise.all([
    revalidatePublicMoviesCatalog(),
    revalidatePublicSeriesCatalog(),
    revalidatePublicAnimationCatalog(),
    revalidatePublicHomeGenreRails(),
  ]);
}

export function revalidatePublicMoviePages(...slugs: Array<string | null | undefined>): Promise<void> {
  const normalizedSlugs = uniqueSlugs(...slugs);

  return syncViewerCacheAfterAdminSave({ movieSlugs: normalizedSlugs });
}

export function revalidatePublicSeriesPages(...slugs: Array<string | null | undefined>): Promise<void> {
  const normalizedSlugs = uniqueSlugs(...slugs);

  return syncViewerCacheAfterAdminSave({ seriesSlugs: normalizedSlugs });
}

export function revalidatePublicHomePage(): Promise<unknown[]> {
  return Promise.all([
    revalidateViewerNextCache(),
    revalidatePublicCatalogClientCaches(),
  ]);
}

/** Invalidate home hero + catalog caches after admin slider/visibility changes. */
export async function syncViewerCacheAfterAdminSave(options?: {
  movieSlugs?: Array<string | null | undefined>;
  seriesSlugs?: Array<string | null | undefined>;
}): Promise<void> {
  const movieSlugs = uniqueSlugs(...(options?.movieSlugs ?? []));
  const seriesSlugs = uniqueSlugs(...(options?.seriesSlugs ?? []));

  await Promise.all([
    revalidateViewerNextCache({ movieSlugs, seriesSlugs }),
    revalidatePublicCatalogClientCaches(),
    ...movieSlugs.map((slug) => revalidatePublicMovieDetail(slug)),
    ...seriesSlugs.map((slug) => revalidatePublicSeriesDetail(slug)),
  ]);
}
