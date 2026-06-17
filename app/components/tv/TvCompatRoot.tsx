"use client";

import { useEffect } from "react";
import { useIsTv } from "../../hooks/useTvCapabilities";

/**
 * Enables TV-specific CSS fallbacks on document root.
 */
export default function TvCompatRoot() {
  const isTv = useIsTv();

  useEffect(() => {
    if (!isTv) {
      document.documentElement.removeAttribute("data-tv-compat");
      return;
    }

    document.documentElement.setAttribute("data-tv-compat", "true");
  }, [isTv]);

  return null;
}
