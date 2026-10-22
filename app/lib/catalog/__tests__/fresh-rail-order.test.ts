import { describe, expect, it } from "vitest";
import { sortFreshRail } from "../home";

describe("sortFreshRail", () => {
  it("keeps the newest uploaded episode series at the head until a newer upload arrives", () => {
    const series = {
      id: 2,
      catalogKind: "series" as const,
      published_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2026-10-22T12:00:00.000Z",
      fresh_rank_at: "2026-10-22T09:00:00.000Z",
    };
    const movieEditedLater = {
      id: 9,
      catalogKind: "movie" as const,
      published_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-22T18:00:00.000Z",
    };
    const olderSeries = {
      id: 1,
      catalogKind: "series" as const,
      published_at: "2026-10-21T00:00:00.000Z",
      fresh_rank_at: "2026-10-20T00:00:00.000Z",
    };

    const ordered = sortFreshRail([olderSeries, movieEditedLater, series]);

    expect(ordered.map((item) => item.id)).toEqual([2, 1, 9]);

    const newerEpisode = {
      ...olderSeries,
      fresh_rank_at: "2026-10-22T20:00:00.000Z",
    };

    expect(sortFreshRail([series, movieEditedLater, newerEpisode]).map((item) => item.id)).toEqual([
      1, 2, 9,
    ]);
  });
});
