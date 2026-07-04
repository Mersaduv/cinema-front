const GRID_CLASS =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.08] ${className}`} />;
}

export function CatalogLatestSliderSkeleton() {
  return (
    <section className="mb-8" dir="rtl" aria-busy="true" aria-label="جدیدترین‌ها">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Shimmer className="h-7 w-32 rounded-lg" />
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Shimmer key={index} className="h-1.5 w-6 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex h-[168px] gap-2.5 sm:h-[200px] md:h-[232px] md:gap-3 lg:h-[260px]">
        {Array.from({ length: 5 }).map((_, index) => (
          <Shimmer
            key={index}
            className={`rounded-2xl ${index === 0 ? "flex-[2.4]" : "flex-1"}`}
          />
        ))}
      </div>
    </section>
  );
}

export function CatalogFiltersBarSkeleton() {
  return (
    <div
      className="relative z-30 mb-6 space-y-4 rounded-2xl border border-white/[0.08] bg-[#12161f]/90 p-4 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm md:p-5"
      aria-busy="true"
      aria-label="فیلترها"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Shimmer className="h-11 min-w-[200px] flex-1 rounded-2xl" />
        <Shimmer className="h-11 w-28 rounded-2xl" />
        <Shimmer className="h-11 w-28 rounded-2xl" />
        <Shimmer className="h-11 w-28 rounded-2xl" />
        <Shimmer className="h-11 w-36 rounded-2xl" />
        <Shimmer className="h-11 w-24 rounded-2xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Shimmer key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function CatalogPosterGridSkeleton({
  count = 24,
}: {
  count?: number;
}) {
  return (
    <div className={GRID_CLASS} aria-busy="true" aria-label="کاتالوگ">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-0">
          <Shimmer className="aspect-[2/3] w-full rounded-xl" />
          <Shimmer className="mt-2.5 h-4 w-full rounded-lg" />
          <Shimmer className="mt-1.5 h-3 w-2/3 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function CatalogPageSkeleton({
  showLatestSlider = true,
  showFilters = true,
  gridCount = 24,
}: {
  showLatestSlider?: boolean;
  showFilters?: boolean;
  gridCount?: number;
}) {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <section className="mx-auto w-full max-w-[1820px] px-4 py-6 md:px-7 md:py-8">
        {showLatestSlider ? <CatalogLatestSliderSkeleton /> : null}
        {showFilters ? <CatalogFiltersBarSkeleton /> : null}
        <CatalogPosterGridSkeleton count={gridCount} />
      </section>
    </div>
  );
}
