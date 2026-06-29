import { SLIDER_SLIDE_CLASS } from "../catalog/ContentListSlider";

export function RailSkeleton({
  title,
  cardCount = 6,
  animated = true,
}: {
  title: string;
  cardCount?: number;
  animated?: boolean;
}) {
  const pulse = animated ? "animate-pulse" : "";

  return (
    <section className="space-y-4" dir="rtl" aria-busy="true" aria-label={title}>
      <h2 className="text-right text-lg font-bold text-white md:text-xl">
        <span className={`inline-block h-7 w-48 rounded bg-white/10 ${pulse}`} />
      </h2>
      <div className="flex gap-3 overflow-hidden px-0.5">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={index}
            data-slider-slide
            className={SLIDER_SLIDE_CLASS}
            aria-hidden="true"
          >
            <div className={`aspect-[2/3] w-full rounded-xl bg-white/10 ${pulse}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
