"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollPageToTop() {
  if (typeof window === "undefined") {
    return;
  }

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function HomeClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/") {
      return;
    }

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    scrollPageToTop();

    const frame = window.requestAnimationFrame(scrollPageToTop);

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return <div className="bg-[#05070b] text-white">{children}</div>;
}
