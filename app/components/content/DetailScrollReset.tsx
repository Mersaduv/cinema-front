"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollPageToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function DetailScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    scrollPageToTop();
    const frame = window.requestAnimationFrame(scrollPageToTop);

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
