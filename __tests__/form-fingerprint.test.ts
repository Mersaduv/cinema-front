import { fingerprintMovie } from "../app/lib/form-fingerprint";
import type { MovieFormFingerprintInput } from "../app/lib/form-fingerprint";

function createBaseForm(): MovieFormFingerprintInput {
  return {
    tmdb_query: "123",
    title: "Test Movie",
    original_title: "Test",
    slug: "test-movie",
    synopsis: "Synopsis",
    synopsis_en: "",
    age_rating: "PG-13",
    release_year: "2024",
    tmdb_id: "123",
    imdb_id: "",
    homepage_url: "",
    meta_title: "",
    meta_description: "",
    content_warnings: [],
    dash_url: "",
    rating: "8",
    popularity: "",
    vote_count: "",
    poster_url: "https://example.com/poster.jpg",
    backdrop_url: "https://example.com/backdrop.jpg",
    trailer_url: "https://example.com/trailer",
    hls_url: "https://example.com/master.m3u8",
    subtitle_source_path: "",
    dubbed_audio_url: "",
    drm_scheme: "none",
    drm_license_url: "",
    download_links: [{ id: "1", quality: "1080p", url: "https://example.com/1080.mp4" }],
    original_language: "en",
    runtime_minutes: "120",
    provider_name: "",
    production_status: "",
    budget: "",
    revenue: "",
    directors: ["Director A"],
    writers: ["Writer A"],
    genres: ["Drama"],
    tags: [],
    languages: [],
    countries: [],
    actors: [
      { name: "Alice", character: "Hero", profile_url: null, order: 1 },
      { name: "Bob", character: "Villain", profile_url: null, order: 0 },
    ],
    crew: [],
    belongs_to_collection: null,
    is_featured: false,
    catalog_visibility: "catalog_search",
  };
}

describe("fingerprintMovie", () => {
  it("does not change when actors are reordered", () => {
    const base = createBaseForm();
    const reordered = {
      ...base,
      actors: [...base.actors].reverse(),
    };

    expect(fingerprintMovie(reordered)).toBe(fingerprintMovie(base));
  });

  it("changes when an actor name changes", () => {
    const base = createBaseForm();
    const changed = {
      ...base,
      actors: base.actors.map((actor) =>
        actor.name === "Alice" ? { ...actor, name: "Alicia" } : actor,
      ),
    };

    expect(fingerprintMovie(changed)).not.toBe(fingerprintMovie(base));
  });

  it("changes when home slider visibility fields change", () => {
    const base = createBaseForm();
    const featured = {
      ...base,
      is_featured: true,
    };
    const hiddenCatalog = {
      ...base,
      catalog_visibility: "hidden",
    };

    expect(fingerprintMovie(featured)).not.toBe(fingerprintMovie(base));
    expect(fingerprintMovie(hiddenCatalog)).not.toBe(fingerprintMovie(base));
  });
});
