import { CatalogPosterGridSkeleton } from "./CatalogPageSkeleton";

function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.08] ${className}`} />;
}

export default function CollectionsPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white" dir="rtl" aria-busy="true">
      <section className="border-b border-[#f5c518]/10 bg-[linear-gradient(180deg,rgba(245,197,24,0.14),rgba(5,7,11,0.98))]">
        <div className="mx-auto max-w-[1820px] px-4 py-12 md:px-7 md:py-16">
          <Shimmer className="h-7 w-40 rounded-full" />
          <Shimmer className="mt-5 h-12 w-64 rounded-2xl md:h-14 md:w-80" />
          <Shimmer className="mt-4 h-20 w-full max-w-3xl rounded-2xl" />
        </div>
      </section>

      <section className="mx-auto max-w-[1820px] px-4 py-10 md:px-7">
        <CatalogPosterGridSkeleton count={48} />
      </section>
    </div>
  );
}
