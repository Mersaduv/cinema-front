"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { IoTvOutline } from "react-icons/io5";

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

  return (
    <div className="bg-[#05070b] text-white">
      {children}

      {/* Mobile-only live TV shortcut */}
      <a
        href="http://cinema.af/live/"
        aria-label="شبکه‌های تلویزیون"
        className="fixed bottom-5 left-4 z-40 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f5c518] text-[#12100a] shadow-[0_14px_40px_rgba(245,197,24,0.45)] transition hover:bg-[#e8bb0d] active:scale-95 md:hidden"
      >
        <IoTvOutline className="h-9 w-9" aria-hidden />
      </a>
    </div>
  );
}
