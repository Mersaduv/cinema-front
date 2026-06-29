import type { FilterOptions } from "../../lib/filter-options";
import {
  HOME_GENRE_RAIL_DEFINITIONS,
  resolveHomeGenreRailConfig,
} from "../../lib/catalog/home-genre-rails";
import { LazyRail } from "./LazyRail";

export function GenreRailsSection({
  filterOptions,
}: {
  filterOptions: FilterOptions;
}) {
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
