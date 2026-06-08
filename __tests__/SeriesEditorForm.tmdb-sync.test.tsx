import { describe, expect, it } from "vitest";
import {
  applyTmdbSeasonToForm,
  applyTmdbSeriesOverviewToForm,
  finalizeTmdbSeriesSyncExclusions,
  isTmdbSeasonExcluded,
  resolveSeasonNumbersForTmdbSync,
  type SeriesFormState,
} from "../app/admin/content-management/series/_lib/series-tmdb-sync";
import type { TmdbSeriesPayload } from "../app/lib/admin-series";

function createBaseForm(): SeriesFormState {
  return {
    title: "Existing",
    slug: "existing",
    original_title: "Existing Original",
    synopsis: "Existing synopsis",
    first_air_date: "",
    last_air_date: "",
    release_year: "2020",
    status: "Ended",
    episode_runtime_minutes: "45",
    number_of_seasons: "1",
    number_of_episodes: "1",
    network: "HBO",
    provider_name: "HBO",
    poster_url: "https://cdn.example/poster.jpg",
    backdrop_url: "",
    trailer_url: "",
    homepage_url: "",
    age_rating: "TV-MA",
    is_featured: false,
    publish_status: "draft",
    scheduled_for: "",
    tmdb_query: "",
    tmdb_id: "99",
    imdb_id: "",
    tvdb_id: "",
    rating: "8",
    original_language: "en",
    creators: [],
    directors: [],
    writers: [],
    genres: ["درام"],
    tags: [],
    languages: [],
    countries: [],
    actors: [],
    crew: [],
    hls_base_url: "https://cdn.example/series",
    seasons: [
      {
        id: "season-1",
        season_number: "1",
        name: "فصل 1",
        synopsis: "",
        synopsis_en: "",
        air_date: "",
        episode_count: "1",
        poster_url: "",
        hls_base_url: "https://cdn.example/series/season-01",
        episodes: [
          {
            id: "episode-1",
            episode_number: "1",
            title: "Pilot",
            synopsis: "",
            synopsis_en: "",
            air_date: "",
            duration_minutes: "45",
            still_url: "",
            source_method: "hls",
            video_url: "",
            embed_url: "",
            hls_url: "https://cdn.example/series/season-01/episode-01/master.m3u8",
            hls_verified: true,
            download_links: { "1080p": "https://cdn.example/dl.mp4" },
            subtitle_url: "https://cdn.example/sub.vtt",
            dubbed_audio_url: "https://cdn.example/dub.m3u8",
            publish_status: "draft",
          },
        ],
      },
    ],
    tmdb_excluded_season_numbers: [2],
    tmdb_excluded_episodes: [{ season_number: 1, episode_number: 9 }],
  };
}

function createOverviewPayload(): TmdbSeriesPayload {
  return {
    tmdb_id: 1396,
    tmdb_query: "1396",
    imdb_id: "tt0944947",
    tvdb_id: "121361",
    title: "TMDB Title",
    original_title: "TMDB Original",
    original_language: "en",
    synopsis: "TMDB synopsis",
    poster_url: "https://image.tmdb.org/poster.jpg",
    backdrop_url: "https://image.tmdb.org/backdrop.jpg",
    trailer_url: "https://youtube.com/watch?v=abc",
    genres: ["Drama"],
    tags: ["fantasy"],
    languages: ["English"],
    countries: ["US"],
    release_year: 2019,
    first_air_date: "2019-01-01",
    last_air_date: "2024-01-01",
    rating: 8.5,
    age_rating: "TV-MA",
    episode_runtime_minutes: 60,
    creators: ["Creator One"],
    directors: ["Director One"],
    writers: ["Writer One"],
    production_status: "Returning Series",
    show_type: "Scripted",
    network: "HBO",
    homepage_url: "https://example.com",
    number_of_seasons: 2,
    number_of_episodes: 20,
    actors: [],
    season_numbers: [1, 2],
    seasons: [],
  };
}

describe("Series TMDB sync helpers", () => {
  it("applies overview without touching seasons or exclusions", () => {
    const current = createBaseForm();
    const next = applyTmdbSeriesOverviewToForm(current, createOverviewPayload(), "1396");

    expect(next.title).toBe("TMDB Title");
    expect(next.tmdb_id).toBe("1396");
    expect(next.seasons).toBe(current.seasons);
    expect(next.tmdb_excluded_season_numbers).toEqual([2]);
    expect(next.tmdb_excluded_episodes).toEqual([{ season_number: 1, episode_number: 9 }]);
  });

  it("merges a season without overwriting protected HLS fields", () => {
    const current = createBaseForm();
    const next = applyTmdbSeasonToForm(
      current,
      {
        season_number: 1,
        name: "Season 1 TMDB",
        synopsis: "Season synopsis",
        synopsis_en: "Season synopsis EN",
        air_date: "2019-01-01",
        episode_count: 1,
        poster_url: "https://image.tmdb.org/season.jpg",
        hls_base_url: "https://tmdb-should-not-win.example",
        episodes: [
          {
            season_number: 1,
            episode_number: 1,
            title: "TMDB Episode",
            synopsis: "Episode synopsis",
            synopsis_en: "Episode synopsis EN",
            air_date: "2019-01-01",
            duration_minutes: 58,
            still_url: "https://image.tmdb.org/still.jpg",
            source_method: "hls",
            video_url: null,
            embed_url: null,
            hls_url: "https://tmdb-should-not-win.example/master.m3u8",
            hls_verified: true,
            download_links: { "720p": "https://tmdb-should-not-win.example/dl.mp4" },
            subtitle_url: "https://tmdb-should-not-win.example/sub.vtt",
            dubbed_audio_url: "https://tmdb-should-not-win.example/dub.m3u8",
            publish_status: "draft",
          },
        ],
      },
      { fullSeasonResync: true },
    );

    const episode = next.seasons[0].episodes[0];
    expect(episode.hls_url).toBe("https://cdn.example/series/season-01/episode-01/master.m3u8");
    expect(episode.hls_verified).toBe(true);
    expect(episode.download_links).toEqual({ "1080p": "https://cdn.example/dl.mp4" });
    expect(episode.subtitle_url).toBe("https://cdn.example/sub.vtt");
    expect(episode.dubbed_audio_url).toBe("https://cdn.example/dub.m3u8");
    expect(next.seasons[0].hls_base_url).toBe("https://cdn.example/series/season-01");
  });

  it("skips excluded seasons when resolving season numbers", () => {
    const numbers = resolveSeasonNumbersForTmdbSync(createOverviewPayload(), [2]);

    expect(numbers).toEqual([1]);
    expect(isTmdbSeasonExcluded([2], 2)).toBe(true);
  });

  it("clears exclusions only after finalize helper runs", () => {
    const cleared = finalizeTmdbSeriesSyncExclusions(createBaseForm());

    expect(cleared.tmdb_excluded_season_numbers).toEqual([]);
    expect(cleared.tmdb_excluded_episodes).toEqual([]);
  });
});
