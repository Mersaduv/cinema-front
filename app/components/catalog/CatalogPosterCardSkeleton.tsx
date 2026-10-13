import { SeriesStackShell } from "./SeriesPosterStack";
import { SLIDER_SLIDE_CLASS } from "./ContentListSlider";

export default function CatalogPosterCardSkeleton({
  className = "",
  isSeries = false,
}: {
  className?: string;
  isSeries?: boolean;
}) {
  const shell = (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-[#12161f] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${
        isSeries ? "z-[1]" : ""
      }`}
      data-tv-poster-shell
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a2030] via-[#12161f] to-[#0d1018]" />
    </div>
  );

  return (
    <div aria-hidden="true" className={`block w-full min-w-0 rounded-xl ${className}`}>
      {isSeries ? <SeriesStackShell>{shell}</SeriesStackShell> : shell}

      <div className="mt-2.5 space-y-2 text-right">
        <div className="ms-auto h-4 w-[88%] animate-pulse rounded bg-[#1a2030]" />
        <div className="ms-auto h-4 w-[62%] animate-pulse rounded bg-[#151a24]" />
        <div className="flex justify-end">
          <div className="h-5 w-16 animate-pulse rounded bg-[#1a2030]" />
        </div>
      </div>
    </div>
  );
}

export { SLIDER_SLIDE_CLASS };
