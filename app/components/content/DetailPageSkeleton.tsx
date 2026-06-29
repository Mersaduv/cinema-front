export default function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <div className="relative h-[72vh] min-h-[420px] animate-pulse bg-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-[#05070b]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-10 md:px-7 md:pb-14">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 md:flex-row md:items-end">
            <div className="hidden h-[280px] w-[190px] shrink-0 rounded-2xl bg-white/10 md:block" />
            <div className="flex-1 space-y-4">
              <div className="h-10 w-2/3 max-w-lg rounded-xl bg-white/10" />
              <div className="h-5 w-1/2 max-w-md rounded-lg bg-white/8" />
              <div className="flex gap-3 pt-2">
                <div className="h-12 w-32 rounded-full bg-white/10" />
                <div className="h-12 w-36 rounded-full bg-white/8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-10 md:px-7">
        <div className="flex gap-6 border-b border-white/10 pb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`detail-tab-skeleton-${index}`}
              className="h-5 w-24 rounded bg-white/8"
            />
          ))}
        </div>
        <div className="space-y-4 rounded-[34px] border border-white/8 bg-white/[0.03] p-8">
          <div className="h-7 w-40 rounded bg-white/10" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-white/8" />
            <div className="h-4 w-full rounded bg-white/8" />
            <div className="h-4 w-4/5 rounded bg-white/8" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`cast-skeleton-${index}`}
              className="h-44 w-32 shrink-0 rounded-2xl bg-white/8"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
