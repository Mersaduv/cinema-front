"use client";

import { mutate } from "swr";

export function revalidateAdminSeriesList(): Promise<unknown[]> {
  return mutate(
    (key) => typeof key === "string" && key.startsWith("/admin/series?"),
    undefined,
    { revalidate: true },
  );
}
