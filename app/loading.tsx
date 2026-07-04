import { RailSkeleton } from "./components/home/RailSkeleton";
import { CatalogLatestSliderSkeleton } from "./components/skeletons/CatalogPageSkeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <div className="h-[min(72vh,720px)] animate-pulse bg-white/[0.04]" aria-hidden />
      <div className="relative z-10 -mt-16 space-y-8 px-4 pb-16 md:px-7 md:pb-20 md:-mt-20">
        <CatalogLatestSliderSkeleton />
        <RailSkeleton title="جدید و محبوب" cardCount={6} />
        <RailSkeleton title="محبوب‌ترین فیلم‌ها" cardCount={6} />
        <RailSkeleton title="در حال بارگذاری" cardCount={6} />
      </div>
    </div>
  );
}
