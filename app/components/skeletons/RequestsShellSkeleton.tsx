function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.08] ${className}`} />;
}

export function RequestsListContentSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 text-white md:px-6" aria-busy="true">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <Shimmer className="h-4 w-24 rounded-lg" />
          <Shimmer className="h-9 w-56 rounded-2xl" />
          <Shimmer className="h-4 w-80 max-w-full rounded-lg" />
        </div>
        <Shimmer className="h-12 w-36 rounded-2xl" />
      </div>
      <Shimmer className="mb-6 h-12 w-full max-w-xs rounded-2xl" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Shimmer className="h-6 w-2/3 rounded-lg" />
                <Shimmer className="h-4 w-24 rounded-lg" />
              </div>
              <Shimmer className="h-7 w-20 rounded-full" />
            </div>
            <Shimmer className="mt-4 h-16 w-full rounded-2xl" />
            <Shimmer className="mt-4 h-3 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RequestsFormContentSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 text-white md:px-6" aria-busy="true">
      <Shimmer className="mb-3 h-4 w-40 rounded-lg" />
      <div className="mb-8 space-y-2">
        <Shimmer className="h-9 w-48 rounded-2xl" />
        <Shimmer className="h-4 w-full max-w-md rounded-lg" />
      </div>
      <div className="space-y-5 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Shimmer className="h-4 w-28 rounded-lg" />
            <Shimmer className={`h-12 w-full rounded-2xl ${index === 2 ? "h-40" : ""}`} />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Shimmer className="h-12 w-32 rounded-2xl" />
          <Shimmer className="h-12 w-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function RequestsShellSkeleton({
  variant = "list",
}: {
  variant?: "list" | "form";
}) {
  return (
    <div
      className="flex min-h-screen bg-[radial-gradient(circle_at_top,#1f1a0b_0%,#0b0b0b_45%,#080808_100%)]"
      dir="rtl"
    >
      <aside className="sticky top-0 hidden h-screen w-80 flex-col border-l border-[#3c3212] bg-[#111111]/95 backdrop-blur md:flex">
        <div className="border-b border-[#3c3212] p-6">
          <div className="flex items-center gap-3">
            <Shimmer className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-28 rounded-lg" />
              <Shimmer className="h-3 w-20 rounded-lg" />
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Shimmer key={index} className="h-12 w-full rounded-lg" />
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto py-8">
        {variant === "form" ? (
          <RequestsFormContentSkeleton />
        ) : (
          <RequestsListContentSkeleton />
        )}
      </main>
    </div>
  );
}
