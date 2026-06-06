"use client";

export default function ContentDetailSkeleton({ kind }: { kind: "movie" | "series" }) {
  const tabCount = kind === "series" ? 4 : 3;

  return (
    <div className="bg-[#05070b] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#0b1017,#111927,#0b1017)]" />
        <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(5,7,11,0.15)_0%,rgba(5,7,11,0.55)_42%,rgba(5,7,11,0.94)_72%,rgba(5,7,11,0.98)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.15)_0%,rgba(5,7,11,0.35)_55%,rgba(5,7,11,0.96)_100%)]" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <div className="mx-auto grid w-full max-w-[1820px] flex-1 items-end gap-8 px-4 pb-16 pt-28 md:px-7 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-12">
            <div className="mx-auto w-full max-w-[280px] lg:mx-0">
              <div className="aspect-[2/3] animate-pulse rounded-[32px] border border-white/10 bg-white/10" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="h-[76px] animate-pulse rounded-[24px] border border-white/8 bg-white/8" />
                <div className="h-[76px] animate-pulse rounded-[24px] border border-white/8 bg-white/8" />
              </div>
            </div>

            <div className="min-w-0 space-y-6">
              <div className="h-12 w-4/5 max-w-2xl animate-pulse rounded-2xl bg-white/10 md:h-16" />

              <div className="h-5 w-1/3 max-w-xs animate-pulse rounded-full bg-white/8" />

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`genre-skeleton-${index}`}
                    className="h-8 animate-pulse rounded-full bg-white/10"
                    style={{ width: `${72 + (index % 3) * 24}px` }}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`badge-skeleton-${index}`}
                    className="h-8 w-24 animate-pulse rounded-full bg-white/8"
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={`meta-skeleton-${index}`}
                    className="h-9 w-24 animate-pulse rounded-full bg-white/8"
                  />
                ))}
              </div>

              <div className="mt-2 max-w-3xl space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`synopsis-skeleton-${index}`}
                    className="h-4 animate-pulse rounded bg-white/8"
                    style={{ width: `${96 - index * 8}%` }}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="h-14 w-44 animate-pulse rounded-2xl bg-white/12" />
              </div>
            </div>
          </div>

          <div className="flex justify-center pb-10">
            <div className="h-10 w-10 animate-pulse rounded-full border border-white/10 bg-white/8" />
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto w-full max-w-[1820px] px-4 pb-20 pt-8 md:px-7">
        <div className="sticky top-[126px] z-30 border-b border-white/10 bg-[#05070b]/95 backdrop-blur-xl xl:top-[92px]">
          <div className="flex flex-wrap items-center gap-6 overflow-x-auto py-5">
            {Array.from({ length: tabCount }).map((_, index) => (
              <div
                key={`tab-skeleton-${index}`}
                className="h-10 w-28 animate-pulse rounded-full bg-white/8"
              />
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-16">
          <div className="rounded-[34px] border border-white/8 bg-white/[0.03] p-6 md:p-8">
            <div className="mb-5 h-6 w-40 animate-pulse rounded bg-white/10" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`line-skeleton-${index}`}
                  className="h-4 animate-pulse rounded bg-white/8"
                  style={{ width: `${92 - index * 6}%` }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`cast-skeleton-${index}`} className="rounded-[30px] border border-white/8 bg-white/[0.03] p-4">
                <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-white/10" />
                <div className="mx-auto mt-4 h-4 w-20 animate-pulse rounded bg-white/10" />
                <div className="mx-auto mt-2 h-3 w-16 animate-pulse rounded bg-white/8" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
