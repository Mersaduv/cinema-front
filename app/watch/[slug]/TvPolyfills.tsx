"use client";

import { useEffect } from "react";
import { detectDeviceCapabilities } from "../../features/player/services/capability";

/**
 * Legacy TV polyfills — only load core-js on actual TV browsers.
 * Desktop/mobile skip this entirely (major watch-page boot win).
 */
export default function TvPolyfills() {
  useEffect(() => {
    const caps = detectDeviceCapabilities();
    if (!caps.isTv) {
      return;
    }

    void import("core-js/stable");
  }, []);

  return null;
}
