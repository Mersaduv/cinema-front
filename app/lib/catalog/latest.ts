import type { CatalogListItem } from "./rest";
import type { CatalogFiltersState } from "./search-params";

export const LATEST_CATALOG_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "release_year_desc",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
};

export const LATEST_SLIDER_COUNT = 6;
export const LATEST_FETCH_POOL = 48;

export function sortCatalogByReleaseYear<T extends CatalogListItem>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftYear = left.release_year ?? 0;
    const rightYear = right.release_year ?? 0;

    if (rightYear !== leftYear) {
      return rightYear - leftYear;
    }

    return right.id - left.id;
  });
}

export function pickLatestSliderItems<T extends CatalogListItem>(items: T[]): T[] {
  return sortCatalogByReleaseYear(items).slice(0, LATEST_SLIDER_COUNT);
}
