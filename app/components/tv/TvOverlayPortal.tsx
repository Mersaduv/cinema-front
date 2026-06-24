"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders TV overlays on document.body so `position: fixed` is not trapped
 * by backdrop-filter / transform ancestors (common on catalog filter chrome).
 */
export default function TvOverlayPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}
