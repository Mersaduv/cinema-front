"use client";

import { mutate } from "swr";

export function revalidateAdminMoviesList(): Promise<unknown[]> {
  return mutate(
    (key) => typeof key === "string" && key.startsWith("/admin/movies?"),
    undefined,
    { revalidate: true },
  );
}
