import CatalogClient from "../components/catalog/CatalogClient";
import {
  LATEST_CATALOG_FILTERS,
  LATEST_FETCH_POOL,
  pickLatestSliderItems,
} from "../lib/catalog/latest";
import { parseCatalogFilters } from "../lib/catalog/search-params";
import { fetchMoviesCatalogRest } from "../lib/catalog/rest";
import { fetchFilterOptions } from "../lib/filter-options";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MoviesCatalogPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const query = await searchParams;
  const filters = parseCatalogFilters(query);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;

  const [filterOptions, catalogResult, latestResult] = await Promise.all([
    fetchFilterOptions({ cache: "force-cache" }),
    fetchMoviesCatalogRest(filters, page, 24),
    fetchMoviesCatalogRest(LATEST_CATALOG_FILTERS, 1, LATEST_FETCH_POOL),
  ]);

  return (
    <CatalogClient
      kind="movie"
      initialItems={catalogResult.items}
      initialLatestItems={pickLatestSliderItems(latestResult.items)}
      initialMeta={catalogResult.meta}
      initialFilters={filters}
      filterOptions={filterOptions}
      initialError={catalogResult.error}
    />
  );
}
