import { SLIDER_SLIDE_CLASS } from "./ContentListSlider";

export default function CatalogPosterCardSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`block w-full min-w-0 rounded-xl ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#12161f]" data-tv-poster-shell>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a2030] via-[#12161f] to-[#0d1018]" />
      </div>

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
