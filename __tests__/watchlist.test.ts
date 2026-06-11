import { describe, expect, it, beforeEach } from "vitest";
import {
  isWatchlisted,
  listWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
  watchlistCount,
} from "../app/lib/watchlist";

describe("watchlist", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("adds and removes items for a user", () => {
    const userId = 42;

    expect(isWatchlisted(userId, "movie", 1)).toBe(false);

    const added = toggleWatchlist(userId, {
      kind: "movie",
      id: 1,
      slug: "inception",
      title: "Inception",
      poster_url: "/images/poster.jpg",
      release_year: 2010,
    });

    expect(added.saved).toBe(true);
    expect(isWatchlisted(userId, "movie", 1)).toBe(true);
    expect(listWatchlist(userId)).toHaveLength(1);

    const removed = toggleWatchlist(userId, {
      kind: "movie",
      id: 1,
      slug: "inception",
      title: "Inception",
    });

    expect(removed.saved).toBe(false);
    expect(listWatchlist(userId)).toHaveLength(0);
  });

  it("removes a single item and reports count", () => {
    const userId = 7;

    toggleWatchlist(userId, {
      kind: "series",
      id: 3,
      slug: "fallout",
      title: "Fallout",
    });

    expect(watchlistCount(userId)).toBe(1);

    const next = removeFromWatchlist(userId, "series", 3);

    expect(next).toHaveLength(0);
    expect(watchlistCount(userId)).toBe(0);
  });
});
