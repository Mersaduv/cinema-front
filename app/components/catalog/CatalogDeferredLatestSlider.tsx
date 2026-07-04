import CatalogLatestSlider from "./CatalogLatestSlider";
import {
  LATEST_CATALOG_FILTERS,
  LATEST_FETCH_POOL,
  pickLatestSliderItems,
} from "../../lib/catalog/latest";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
} from "../../lib/catalog/rest";

export default async function CatalogDeferredLatestSlider({
  kind,
}: {
  kind: "movie" | "series";
}) {
  const fetcher = kind === "movie" ? fetchMoviesCatalogRest : fetchSeriesCatalogRest;
  const result = await fetcher(
    LATEST_CATALOG_FILTERS,
    1,
    LATEST_FETCH_POOL,
    undefined,
    { skipFetchCache: true },
  );
  const items = pickLatestSliderItems(result.items);

  return <CatalogLatestSlider items={items} kind={kind} />;
}
