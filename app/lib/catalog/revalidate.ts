"use client";

import { mutate } from "swr";

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

export function revalidatePublicMoviePages(...slugs: Array<string | null | undefined>): Promise<unknown[]> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map((slug) => slug?.trim()).filter((slug): slug is string => Boolean(slug))),
  );

  return Promise.all([
    revalidatePublicMoviesCatalog(),
    revalidatePublicAnimationCatalog(),
    ...uniqueSlugs.map((slug) => revalidatePublicMovieDetail(slug)),
  ]);
}

export function revalidatePublicSeriesPages(...slugs: Array<string | null | undefined>): Promise<unknown[]> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map((slug) => slug?.trim()).filter((slug): slug is string => Boolean(slug))),
  );

  return Promise.all([
    revalidatePublicSeriesCatalog(),
    revalidatePublicAnimationCatalog(),
    ...uniqueSlugs.map((slug) => revalidatePublicSeriesDetail(slug)),
  ]);
}
