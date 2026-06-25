"use client";

import { useEffect } from "react";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";

/**
 * Enables TV-specific CSS fallbacks on document root.
 */
export default function TvCompatRoot() {
  const isTvCompat = useIsTvCompat();

  useEffect(() => {
    if (!isTvCompat) {
      document.documentElement.removeAttribute("data-tv-compat");
      return;
    }

    document.documentElement.setAttribute("data-tv-compat", "true");
  }, [isTvCompat]);

  return null;
}
