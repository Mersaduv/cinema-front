import { CatalogPosterGridSkeleton } from "./CatalogPageSkeleton";

function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.08] ${className}`} />;
}

export default function CollectionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white" dir="rtl" aria-busy="true">
      <section className="relative overflow-hidden border-b border-white/10">
        <Shimmer className="h-[280px] w-full rounded-none md:h-[360px]" />
        <div className="relative mx-auto max-w-[1820px] px-4 py-16 md:px-7 md:py-24">
          <Shimmer className="h-7 w-36 rounded-full" />
          <Shimmer className="mt-5 h-14 w-full max-w-2xl rounded-2xl md:h-16" />
          <Shimmer className="mt-5 h-24 w-full max-w-3xl rounded-2xl" />
          <Shimmer className="mt-6 h-5 w-48 rounded-lg" />
        </div>
      </section>

      <section className="mx-auto max-w-[1820px] px-4 py-10 md:px-7">
        <CatalogPosterGridSkeleton count={24} />
      </section>
    </div>
  );
}
