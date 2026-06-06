import CatalogClient from "../components/catalog/CatalogClient";
import { parseCatalogFilters } from "../lib/catalog/search-params";
import { fetchSeriesCatalogRest } from "../lib/catalog/rest";
import { fetchFilterOptions } from "../lib/filter-options";

export const revalidate = 300;

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SeriesCatalogPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const query = await searchParams;
  const filters = parseCatalogFilters(query);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;

  const [filterOptions, catalogResult] = await Promise.all([
    fetchFilterOptions({ cache: "force-cache" }),
    fetchSeriesCatalogRest(filters, page, 24),
  ]);

  return (
    <CatalogClient
      kind="series"
      title="سریال‌ها"
      description="آرشیو سریال‌های منتشرشده با فصل‌ها، قسمت‌ها و وضعیت پخش به‌صورت فارسی."
      initialItems={catalogResult.items}
      initialMeta={catalogResult.meta}
      initialFilters={filters}
      filterOptions={filterOptions}
      initialError={catalogResult.error}
    />
  );
}
