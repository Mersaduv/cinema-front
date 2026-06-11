import AnimationCatalogClient from "../components/catalog/AnimationCatalogClient";
import {
  fetchAnimationCatalogMerged,
  parseAnimationCatalogFilters,
  parseAnimationSubtypes,
  resolveAnimationSubtypeGenreValues,
  withAnimationGenreFilter,
} from "../lib/catalog/animation";
import { LATEST_FETCH_POOL, pickLatestSliderItems } from "../lib/catalog/latest";
import { fetchFilterOptions } from "../lib/filter-options";

export const dynamic = "force-dynamic";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AnimationCatalogPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const query = await searchParams;
  const subtypes = parseAnimationSubtypes(query);
  const filters = parseAnimationCatalogFilters(query);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;

  const filterOptions = await fetchFilterOptions({ cache: "force-cache" });
  const subtypeGenreValues = resolveAnimationSubtypeGenreValues(filterOptions, subtypes);
  const effectiveFilters = withAnimationGenreFilter(filters, subtypeGenreValues);
  const latestFilters = withAnimationGenreFilter(
    {
      search: "",
      sort: "release_year_desc",
      genres: [],
      countries: [],
      languages: [],
      year_from: null,
      year_to: null,
      min_rating: "",
    },
    subtypeGenreValues,
  );

  const [catalogResult, latestResult] = await Promise.all([
    fetchAnimationCatalogMerged(effectiveFilters, page, 24),
    fetchAnimationCatalogMerged(latestFilters, 1, LATEST_FETCH_POOL),
  ]);

  return (
    <AnimationCatalogClient
      initialSubtypes={subtypes}
      initialItems={catalogResult.items}
      initialLatestItems={pickLatestSliderItems(latestResult.items)}
      initialMeta={catalogResult.meta}
      initialFilters={filters}
      filterOptions={filterOptions}
      initialError={catalogResult.error}
    />
  );
}
