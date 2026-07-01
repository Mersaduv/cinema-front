type FingerprintActor = {
  name?: string | null;
  character?: string | null;
  profile_url?: string | null;
  order?: number | null;
};

type FingerprintCrewRow = {
  name: string;
  job: string;
};

type FingerprintDownloadRow = {
  quality: string;
  url: string;
};

export type MovieFormFingerprintInput = {
  is_featured?: boolean;
  catalog_visibility?: string;
  actors: FingerprintActor[];
  crew: FingerprintCrewRow[];
  download_links: FingerprintDownloadRow[];
  genres?: string[];
  tags?: string[];
  languages?: string[];
  countries?: string[];
  directors?: string[];
  writers?: string[];
  content_warnings?: string[];
  [key: string]: unknown;
};

function sortedStrings(values: string[] | undefined): string[] {
  return [...(values ?? [])].sort((left, right) => left.localeCompare(right));
}

export function fingerprintMovie(form: MovieFormFingerprintInput): string {
  const normalized = {
    ...form,
    actors: [...form.actors].sort((left, right) =>
      (left.name ?? "").localeCompare(right.name ?? ""),
    ),
    crew: [...form.crew].sort((left, right) =>
      `${left.name}${left.job}`.localeCompare(`${right.name}${right.job}`),
    ),
    download_links: [...form.download_links].sort((left, right) =>
      left.quality.localeCompare(right.quality),
    ),
    genres: sortedStrings(form.genres),
    tags: sortedStrings(form.tags),
    languages: sortedStrings(form.languages),
    countries: sortedStrings(form.countries),
    directors: sortedStrings(form.directors),
    writers: sortedStrings(form.writers),
    content_warnings: sortedStrings(form.content_warnings),
  };

  return JSON.stringify(normalized);
}
