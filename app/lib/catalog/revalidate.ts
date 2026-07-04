"use client";

import { mutate } from "swr";
import { tokenStorage } from "../token-storage";

function uniqueSlugs(...slugs: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(slugs.map((slug) => slug?.trim()).filter((slug): slug is string => Boolean(slug))),
  );
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

async function refreshPublicViewerServerCache(options?: {
  paths?: string[];
  movieSlugs?: string[];
  seriesSlugs?: string[];
}): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const token = tokenStorage.getToken();

  if (!token) {
    return;
  }

  try {
    await fetch("/api/admin/revalidate-viewer", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paths: options?.paths,
        movieSlugs: options?.movieSlugs,
        seriesSlugs: options?.seriesSlugs,
      }),
      cache: "no-store",
    });
  } catch {
    // Backend queue may still revalidate; keep admin UX non-blocking.
  }
}

export function revalidatePublicMoviePages(...slugs: Array<string | null | undefined>): Promise<void> {
  const normalizedSlugs = uniqueSlugs(...slugs);

  return Promise.all([
    revalidatePublicCatalogClientCaches(),
    ...normalizedSlugs.map((slug) => revalidatePublicMovieDetail(slug)),
    refreshPublicViewerServerCache({ movieSlugs: normalizedSlugs }),
  ]).then(() => undefined);
}

export function revalidatePublicSeriesPages(...slugs: Array<string | null | undefined>): Promise<void> {
  const normalizedSlugs = uniqueSlugs(...slugs);

  return Promise.all([
    revalidatePublicCatalogClientCaches(),
    ...normalizedSlugs.map((slug) => revalidatePublicSeriesDetail(slug)),
    refreshPublicViewerServerCache({ seriesSlugs: normalizedSlugs }),
  ]).then(() => undefined);
}

export function revalidatePublicHomePage(): Promise<void> {
  return Promise.all([
    revalidatePublicCatalogClientCaches(),
    refreshPublicViewerServerCache(),
  ]).then(() => undefined);
}

/**
 * Lightweight client-side SWR refresh after admin saves.
 * Also invalidates Next.js home/slider server cache via /api/admin/revalidate-viewer.
 */
export async function syncViewerCacheAfterAdminSave(options?: {
  movieSlugs?: Array<string | null | undefined>;
  seriesSlugs?: Array<string | null | undefined>;
  affectsHomeSlider?: boolean;
}): Promise<void> {
  const movieSlugs = uniqueSlugs(...(options?.movieSlugs ?? []));
  const seriesSlugs = uniqueSlugs(...(options?.seriesSlugs ?? []));

  await Promise.all([
    revalidatePublicCatalogClientCaches(),
    ...movieSlugs.map((slug) => revalidatePublicMovieDetail(slug)),
    ...seriesSlugs.map((slug) => revalidatePublicSeriesDetail(slug)),
    refreshPublicViewerServerCache({
      movieSlugs,
      seriesSlugs,
      paths: options?.affectsHomeSlider ? ["/"] : undefined,
    }),
  ]);
}
