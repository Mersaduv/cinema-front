import {
  HOME_GENRE_RAIL_DEFINITIONS,
  resolveHomeGenreRailConfig,
} from "../../lib/catalog/home-genre-rails";
import { getCachedFilterOptions } from "../../lib/filter-options-cache";
import { LazyRail } from "./LazyRail";

export async function GenreRailsSection() {
  const filterOptions = await getCachedFilterOptions();
  const validRails = HOME_GENRE_RAIL_DEFINITIONS.flatMap((definition) => {
    const config = resolveHomeGenreRailConfig(filterOptions, definition);
    return config ? [config] : [];
  });

  return (
    <>
      {validRails.map((railConfig) => (
        <LazyRail key={railConfig.definition.slug} railConfig={railConfig} />
      ))}
    </>
  );
}
