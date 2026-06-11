import { describe, expect, it } from "vitest";
import {
  applyIngestedSeasonImages,
  finalizeTmdbImageIngestMessage,
  mergeIngestedActorProfiles,
} from "../app/lib/admin-tmdb-image-ingest";

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
        poster_url: "/images/2026/season1.jpg",
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
