import CatalogLatestSlider from "./CatalogLatestSlider";
import {
  DEFAULT_ANIMATION_SUBTYPES,
  fetchAnimationCatalogMerged,
  resolveAnimationSubtypeGenreValues,
  withAnimationGenreFilter,
  type SelectableAnimationSubtype,
} from "../../lib/catalog/animation";
import { getCachedFilterOptions } from "../../lib/filter-options-cache";
import {
  LATEST_FETCH_POOL,
  pickLatestSliderItems,
} from "../../lib/catalog/latest";

export default async function AnimationDeferredLatestSlider({
  subtypes,
}: {
  subtypes: SelectableAnimationSubtype[];
}) {
  const filterOptions = await getCachedFilterOptions();
  const subtypeGenreValues = resolveAnimationSubtypeGenreValues(filterOptions, subtypes);
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
    subtypeGenreValues.length > 0
      ? subtypeGenreValues
      : resolveAnimationSubtypeGenreValues(filterOptions, DEFAULT_ANIMATION_SUBTYPES),
  );

  const result = await fetchAnimationCatalogMerged(latestFilters, 1, LATEST_FETCH_POOL);
  const items = pickLatestSliderItems(result.items);

  return <CatalogLatestSlider items={items} kind="movie" useItemKind />;
}
