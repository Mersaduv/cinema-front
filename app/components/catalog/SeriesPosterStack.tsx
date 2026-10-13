import type { ReactNode } from "react";

export type SeriesStackVariant = "portrait" | "landscape";
export type SeriesStackSize = "card" | "detail";

/**
 * Axis-aligned series deck — parallel top edges only (no rotate/skew).
 * Staggered plates read as a tidy multi-episode stack.
 */
export default function SeriesPosterStack({
  className = "",
  variant = "portrait",
  size = "card",
}: {
  className?: string;
  variant?: SeriesStackVariant;
  size?: SeriesStackSize;
}) {
  const isLandscape = variant === "landscape";
  const radius = size === "detail" ? "rounded-[32px]" : "rounded-xl";
  const aspect = isLandscape ? "aspect-video" : "aspect-[2/3]";

  const plate =
    "absolute overflow-hidden border shadow-[0_8px_18px_rgba(0,0,0,0.3)] " +
    "before:pointer-events-none before:absolute before:inset-x-[10%] before:top-0 before:z-[1] " +
    "before:h-px before:content-[''] before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 z-0 ${className}`}
    >
      <span
        className={[
          plate,
          "top-0 border-white/[0.08] bg-[#0f131b] ring-1 ring-inset ring-white/[0.03]",
          isLandscape ? "inset-x-[12%]" : "inset-x-[14%]",
          aspect,
          radius,
        ].join(" ")}
      />
      <span
        className={[
          plate,
          "border-white/[0.12] bg-[#171d28] ring-1 ring-inset ring-white/[0.05]",
          isLandscape ? "top-[4px] inset-x-[6%]" : "top-[5px] inset-x-[7%]",
          aspect,
          radius,
        ].join(" ")}
      />
    </div>
  );
}

/** Consistent padding + stack layers around a series poster shell. */
export function SeriesStackShell({
  children,
  className = "",
  variant = "portrait",
  size = "card",
}: {
  children: ReactNode;
  className?: string;
  variant?: SeriesStackVariant;
  size?: SeriesStackSize;
}) {
  const pad =
    variant === "landscape" ? "pt-2.5" : size === "detail" ? "pt-3.5" : "pt-3";

  return (
    <div className={`relative ${pad} ${className}`}>
      <SeriesPosterStack variant={variant} size={size} />
      {children}
    </div>
  );
}

export function isSeriesCatalogHref(
  href: string,
  catalogKind?: "movie" | "series" | null,
): boolean {
  if (catalogKind === "series") {
    return true;
  }
  if (catalogKind === "movie") {
    return false;
  }

  return href.startsWith("/series/") || href.includes("/series/");
}
