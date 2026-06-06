import CatalogClient from "../components/catalog/CatalogClient";
import { parseCatalogFilters } from "../lib/catalog/search-params";
import { fetchMoviesCatalogRest } from "../lib/catalog/rest";
import { fetchFilterOptions } from "../lib/filter-options";

export const revalidate = 300;

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MoviesCatalogPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const query = await searchParams;
  const filters = parseCatalogFilters(query);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;

  const [filterOptions, catalogResult] = await Promise.all([
    fetchFilterOptions({ cache: "force-cache" }),
    fetchMoviesCatalogRest(filters, page, 24),
  ]);

  return (
    <CatalogClient
      kind="movie"
      title="فیلم‌ها"
      description="آرشیو فیلم‌های منتشرشده با پوستر، ژانر و دسترسی سریع به صفحه جزئیات و پخش."
      initialItems={catalogResult.items}
      initialMeta={catalogResult.meta}
      initialFilters={filters}
      filterOptions={filterOptions}
      initialError={catalogResult.error}
    />
  );
}
