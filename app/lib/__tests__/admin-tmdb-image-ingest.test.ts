import { describe, expect, it } from "vitest";
import {
  applyIngestedPrimaryImages,
  applyIngestedSeasonImages,
  finalizeTmdbImageIngestMessage,
  mergeIngestedActorProfiles,
  resolveTmdbSyncedImageFields,
} from "../admin-tmdb-image-ingest";

describe("admin-tmdb-image-ingest", () => {
  it("merges actor profiles by tmdb person id", () => {
    const current = [
      {
        name: "Actor A",
        tmdb_person_id: 42,
        profile_url: "https://image.tmdb.org/t/p/w185/a.jpg",
      },
      {
        name: "Actor B",
        tmdb_person_id: 7,
        profile_url: "https://image.tmdb.org/t/p/w185/b.jpg",
      },
    ];

    const processed = [
      {
        name: "Actor B",
        tmdb_person_id: 7,
        profile_url: "/images/2026/b.jpg",
        profile_source_url: "https://image.tmdb.org/t/p/w185/b.jpg",
      },
      {
        name: "Actor A",
        tmdb_person_id: 42,
        profile_url: "/images/2026/a.jpg",
        profile_source_url: "https://image.tmdb.org/t/p/w185/a.jpg",
      },
    ];

    const merged = mergeIngestedActorProfiles(current, processed);

    expect(merged[0].profile_url).toBe("/images/2026/a.jpg");
    expect(merged[1].profile_url).toBe("/images/2026/b.jpg");
  });

  it("keeps remote TMDB URLs in source fields only after TMDB sync", () => {
    const next = resolveTmdbSyncedImageFields({
      poster_url: "https://image.tmdb.org/t/p/w780/poster.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/backdrop.jpg",
      current_poster_url: "",
      current_backdrop_url: "",
    });

    expect(next.poster_url).toBe("");
    expect(next.backdrop_url).toBe("");
    expect(next.poster_source_url).toContain("image.tmdb.org");
    expect(next.backdrop_source_url).toContain("image.tmdb.org");
  });

  it("does not keep remote URLs in poster_url when ingest fails", () => {
    const form = {
      poster_url: "https://image.tmdb.org/t/p/w780/poster.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/backdrop.jpg",
      poster_source_url: "https://image.tmdb.org/t/p/w780/poster.jpg",
      backdrop_source_url: "https://image.tmdb.org/t/p/original/backdrop.jpg",
    };

    const next = applyIngestedPrimaryImages(form, {
      poster_url: "https://image.tmdb.org/t/p/w780/poster.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/backdrop.jpg",
      stats: { requested: 2, succeeded: 0, failed: 2 },
    });

    expect(next.poster_url).toBe("");
    expect(next.backdrop_url).toBe("");
    expect(next.poster_source_url).toContain("image.tmdb.org");
  });

  it("applies absolute CDN managed URLs as relative /images paths", () => {
    const form = {
      poster_url: "https://image.tmdb.org/t/p/w780/poster.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/backdrop.jpg",
    };

    const next = applyIngestedPrimaryImages(form, {
      poster_url: "http://cinema.af/images/2026/poster.jpg",
      backdrop_url: "http://cinema.af/images/2026/backdrop.jpg",
    });

    expect(next.poster_url).toBe("/images/2026/poster.jpg");
    expect(next.backdrop_url).toBe("/images/2026/backdrop.jpg");
  });

  it("applies season and episode images by season number", () => {
    const seasons = [
      {
        season_number: "1",
        poster_url: "https://image.tmdb.org/t/p/w500/season1.jpg",
        episodes: [
          {
            episode_number: "1",
            still_url: "https://image.tmdb.org/t/p/w300/still1.jpg",
          },
        ],
      },
    ];

    const processed = [
      {
        season_number: 1,
        poster_url: "http://cinema.af/images/2026/season1.jpg",
        episodes: [
          {
            episode_number: 1,
            still_url: "/images/2026/still1.jpg",
          },
        ],
      },
    ];

    const merged = applyIngestedSeasonImages(seasons, processed);

    expect(merged[0].poster_url).toBe("/images/2026/season1.jpg");
    expect(merged[0].episodes[0].still_url).toBe("/images/2026/still1.jpg");
  });

  it("replaces processing message with completion message", () => {
    expect(
      finalizeTmdbImageIngestMessage(
        "اطلاعات سریال از TMDb اعمال شد؛ پردازش تصاویر در حال انجام است.",
      ),
    ).toBe("اطلاعات سریال از TMDb اعمال شد. تصاویر پردازش شدند.");
  });
});
