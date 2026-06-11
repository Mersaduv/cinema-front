import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineCollection } from "react-icons/hi";
import CatalogPosterCard from "../../components/catalog/CatalogPosterCard";
import { BackdropImage } from "../../components/images";
import { fetchCollectionDetailRest } from "../../lib/collections/rest";

export const revalidate = 300;

type PageParams = Promise<{ slug: string }>;

export default async function CollectionDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const result = await fetchCollectionDetailRest(slug);

  if (!result.collection) {
    notFound();
  }

  const collection = result.collection;

  return (
    <div className="min-h-screen bg-[#05070b] text-white" dir="rtl">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <BackdropImage
            title={collection.name}
            image={collection.backdrop_image}
            src={collection.backdrop_url}
            usage="detail-backdrop"
            wrapperClassName="h-full"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.35),rgba(5,7,11,0.92)_55%,#05070b)]" />
        </div>

        <div className="relative mx-auto max-w-[1820px] px-4 py-16 md:px-7 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
            <HiOutlineCollection className="h-4 w-4" />
            مجموعه فیلم
          </span>
          <h1 className="mt-5 max-w-4xl text-4xl font-black md:text-6xl">{collection.name}</h1>
          {collection.description ? (
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/70 md:text-lg">
              {collection.description}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/55">
            <span>{collection.movies_count.toLocaleString("fa-IR")} فیلم</span>
            <Link href="/collections" className="text-[#f8d977] hover:underline">
              همه مجموعه‌ها
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1820px] px-4 py-10 md:px-7">
        {collection.movies.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center text-white/50">
            هنوز فیلمی در این مجموعه منتشر نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {collection.movies.map((movie) => (
              <CatalogPosterCard
                key={movie.id}
                item={movie}
                href={`/movies/${movie.slug}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
