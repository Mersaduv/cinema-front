/** Full-screen immersive skeleton for the watch page. */
export default function WatchPageSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-black">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#38bdf8]" />
          <p className="text-sm text-white/50" dir="rtl">
            در حال آماده‌سازی پخش...
          </p>
        </div>
      </div>

      <div className="space-y-4 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pb-8 md:p-6">
        <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/8" />
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/8" />
          <div className="h-10 flex-1 animate-pulse rounded-full bg-white/5" />
          <div className="hidden h-10 w-24 animate-pulse rounded-full bg-white/8 sm:block" />
        </div>
      </div>
    </div>
  );
}
