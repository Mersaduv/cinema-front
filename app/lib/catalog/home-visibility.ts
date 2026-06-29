import type { CatalogListItem } from "./rest";

export type CatalogVisibility =
  | "catalog_search"
  | "catalog"
  | "search"
  | "hidden";

export function normalizeCatalogVisibility(
  value?: string | null,
): CatalogVisibility {
  if (
    value === "catalog" ||
    value === "search" ||
    value === "hidden"
  ) {
    return value;
  }

  return "catalog_search";
}

/** Home sliders/hero only — excludes admin "exclude from slider" + search-only/hidden visibility. */
export function isHomeSliderItem(item: CatalogListItem): boolean {
  if (item.exclude_from_slider) {
    return false;
  }

  const visibility = normalizeCatalogVisibility(item.catalog_visibility);

  return visibility === "catalog_search" || visibility === "catalog";
}

export function filterHomeSliderItems<T extends CatalogListItem>(items: T[]): T[] {
  return items.filter(isHomeSliderItem);
}

export function filterHomeCatalogFetchResult<
  T extends { items: CatalogListItem[] },
>(result: T): T {
  const items = filterHomeSliderItems(result.items);

  if (items.length === result.items.length) {
    return result;
  }

  return { ...result, items };
}
