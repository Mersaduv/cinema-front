import { describe, expect, it } from "vitest";
import {
  resolveContentEntryMode,
  isManualEntryMode,
} from "../content-entry-mode";
import {
  validateMovieDetailsTab,
  validateMovieMediaTab,
} from "../movie-tab-validation";
import {
  validateSeriesCatalogTab,
  validateSeriesIdentityTab,
  validateSeriesSeasonsTab,
} from "../series-tab-validation";

const buildSlug = (...candidates: Array<string | null | undefined>) => {
  const hit = candidates.find((value) => (value || "").trim());
  return (hit || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

describe("content-entry-mode", () => {
  it("defaults create to tmdb", () => {
    expect(resolveContentEntryMode({ isCreate: true })).toBe("tmdb");
  });

  it("uses saved manual source", () => {
    expect(
      resolveContentEntryMode({ savedSource: "manual", tmdbId: 123 }),
    ).toBe("manual");
  });

  it("edit without tmdb id resolves to manual", () => {
    expect(resolveContentEntryMode({ tmdbId: null })).toBe("manual");
    expect(isManualEntryMode("manual")).toBe(true);
  });
});

describe("movie-tab-validation manual mode", () => {
  const base = {
    tmdb_id: "",
    title: "فیلم تست",
    slug: "",
    original_title: "",
    synopsis: "",
    release_year: "",
    age_rating: "",
    directors: [] as string[],
    writers: [] as string[],
    actors: [] as Array<{ name: string | null }>,
    genres: [] as string[],
    countries: [] as string[],
    languages: [] as string[],
  };

  it("requires identity and taxonomy fields in manual details", () => {
    const issues = validateMovieDetailsTab(base, buildSlug, "manual");
    expect(issues.map((issue) => issue.field).sort()).toEqual(
      [
        "age_rating",
        "countries",
        "genres",
        "languages",
        "original_title",
        "slug",
        "synopsis",
      ].sort(),
    );
  });

  it("passes when manual required details are filled", () => {
    const issues = validateMovieDetailsTab(
      {
        ...base,
        original_title: "Test Movie",
        slug: "test-movie",
        synopsis: "خلاصه",
        age_rating: "13",
        genres: ["اکشن"],
        countries: ["ایران"],
        languages: ["فارسی"],
      },
      buildSlug,
      "manual",
    );
    expect(issues).toEqual([]);
  });

  it("still requires tmdb fields in tmdb mode", () => {
    const issues = validateMovieDetailsTab(base, buildSlug, "tmdb");
    expect(issues.some((issue) => issue.field === "tmdb_id")).toBe(true);
    expect(issues.some((issue) => issue.field === "synopsis")).toBe(true);
  });

  it("treats writers as optional in tmdb details mode", () => {
    const issues = validateMovieDetailsTab(
      {
        ...base,
        tmdb_id: "123",
        slug: "test-movie",
        original_title: "Test Movie",
        synopsis: "خلاصه",
        release_year: "2024",
        age_rating: "13",
        directors: ["Director One"],
        writers: [],
        actors: [{ name: "Actor One" }],
      },
      buildSlug,
      "tmdb",
    );

    expect(issues.some((issue) => issue.field === "writers")).toBe(false);
  });

  it("requires poster and backdrop in manual media; progressive url optional", () => {
    expect(
      validateMovieMediaTab(
        {
          poster_url: "",
          backdrop_url: "",
          trailer_url: "",
          playback_protocol: "hls",
          progressive_url: "",
          hls_url: "",
        },
        "manual",
      )
        .map((issue) => issue.field)
        .sort(),
    ).toEqual(["backdrop_url", "poster_url"]);

    expect(
      validateMovieMediaTab(
        {
          poster_url: "/images/poster.jpg",
          backdrop_url: "/images/backdrop.jpg",
          trailer_url: "",
          playback_protocol: "mp4",
          progressive_url: "",
          hls_url: "",
        },
        "manual",
      ),
    ).toEqual([]);

    const badMp4 = validateMovieMediaTab(
      {
        poster_url: "/images/poster.jpg",
        backdrop_url: "/images/backdrop.jpg",
        trailer_url: "",
        playback_protocol: "mp4",
        progressive_url: "not-a-video",
        hls_url: "",
      },
      "manual",
    );
    expect(badMp4.some((issue) => issue.field === "progressive_url")).toBe(true);
  });

  it("treats trailer_url as optional in tmdb media mode", () => {
    const issues = validateMovieMediaTab(
      {
        poster_url: "/images/poster.jpg",
        backdrop_url: "/images/backdrop.jpg",
        trailer_url: "",
        playback_protocol: "hls",
        progressive_url: "",
        hls_url: "/hls/movie/index.m3u8",
      },
      "tmdb",
    );

    expect(issues.some((issue) => issue.field === "trailer_url")).toBe(false);
    expect(issues).toEqual([]);
  });
});

describe("series-tab-validation manual mode", () => {
  const ageRatings = ["G", "PG-13", "R", "13"] as const;

  it("requires identity and taxonomy fields in manual identity", () => {
    const issues = validateSeriesIdentityTab(
      {
        title: "سریال تست",
        slug: "",
        original_title: "",
        synopsis: "",
        age_rating: "",
        tmdb_id: "",
        genres: [],
        countries: [],
        languages: [],
      },
      buildSlug,
      ageRatings,
      "manual",
    );
    expect(issues.map((issue) => issue.field).sort()).toEqual(
      [
        "age_rating",
        "countries",
        "genres",
        "languages",
        "original_title",
        "slug",
        "synopsis",
      ].sort(),
    );
  });

  it("passes when manual required identity fields are filled", () => {
    const issues = validateSeriesIdentityTab(
      {
        title: "سریال تست",
        slug: "test-series",
        original_title: "Test Series",
        synopsis: "خلاصه",
        age_rating: "13",
        tmdb_id: "",
        genres: ["درام"],
        countries: ["ایران"],
        languages: ["فارسی"],
      },
      buildSlug,
      ageRatings,
      "manual",
    );
    expect(issues).toEqual([]);
  });

  it("requires poster and backdrop in manual catalog", () => {
    expect(
      validateSeriesCatalogTab(
        { poster_url: "", backdrop_url: "" },
        "manual",
      )
        .map((issue) => issue.field)
        .sort(),
    ).toEqual(["backdrop_url", "poster_url"]);

    expect(
      validateSeriesCatalogTab(
        {
          poster_url: "/images/poster.jpg",
          backdrop_url: "/images/backdrop.jpg",
        },
        "manual",
      ),
    ).toEqual([]);
  });

  it("allows empty seasons in manual mode", () => {
    expect(validateSeriesSeasonsTab({ seasons: [] }, "manual")).toEqual([]);
    expect(
      validateSeriesSeasonsTab({ seasons: [] }, "tmdb").some(
        (issue) => issue.field === "seasons",
      ),
    ).toBe(true);
  });
});
