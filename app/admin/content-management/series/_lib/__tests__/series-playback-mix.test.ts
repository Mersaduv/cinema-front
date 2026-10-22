import { describe, expect, it } from "vitest";
import { validateSeriesSeasonsTab } from "../../../_lib/series-tab-validation";
import { buildEpisodeUpsertPayload } from "../series-episode-payload";
import {
  applyTmdbSeasonToForm,
  inferSeriesPlaybackProtocol,
  resolveMergedEpisodeSourceMethod,
  type EpisodeDraft,
  type SeasonDraft,
  type SeriesFormState,
} from "../series-tmdb-sync";

function episode(overrides: Partial<EpisodeDraft> = {}): EpisodeDraft {
  return {
    id: "episode-1",
    episode_number: "1",
    title: "",
    synopsis: "",
    synopsis_en: "",
    air_date: "",
    duration_minutes: "",
    still_url: "",
    source_method: "url",
    video_url: "",
    embed_url: "",
    hls_url: "",
    hls_verified: false,
    dash_url: "",
    dash_verified: false,
    download_links: {},
    subtitle_url: "",
    dubbed_audio_url: "",
    has_subtitle: false,
    has_dubbed: false,
    publish_status: "draft",
    ...overrides,
  };
}

function season(episodes: EpisodeDraft[]): SeasonDraft {
  return {
    id: "season-1",
    season_number: "1",
    name: "فصل 1",
    synopsis: "",
    synopsis_en: "",
    air_date: "",
    episode_count: String(episodes.length),
    poster_url: "",
    hls_base_url: "",
    episodes,
  };
}

describe("TMDB edit sync appends new rows", () => {
  it("keeps the current list and adds new episodes and seasons after it", () => {
    const current = {
      hls_base_url: "http://cinema.af/content2/Show",
      playback_protocol: "mp4",
      tmdb_excluded_episodes: [],
      tmdb_excluded_season_numbers: [],
      seasons: [
        {
          ...season([
            episode({
              id: "ep-13",
              episode_number: "13",
              source_method: "url",
              video_url: "http://cdn.example/13.mp4",
              hls_url: "",
            }),
          ]),
          id: "season-2",
          season_number: "2",
          name: "فصل 2",
        },
      ],
    } as SeriesFormState;

    const withEpisode = applyTmdbSeasonToForm(
      current,
      {
        season_number: 2,
        name: "فصل 2",
        episodes: [
          { season_number: 2, episode_number: 13, title: "سیزده" },
          { season_number: 2, episode_number: 14, title: "چهارده" },
        ],
      },
      { appendMissing: true },
    );

    expect(withEpisode.seasons.map((item) => item.season_number)).toEqual(["2"]);
    expect(withEpisode.seasons[0]?.episodes.map((item) => item.episode_number)).toEqual([
      "13",
      "14",
    ]);
    expect(withEpisode.seasons[0]?.episodes[0]).toMatchObject({
      source_method: "url",
      video_url: "http://cdn.example/13.mp4",
      hls_url: "",
    });
    expect(withEpisode.seasons[0]?.episodes[1]).toMatchObject({
      hls_url: "",
      hls_verified: false,
    });

    const withSeason = applyTmdbSeasonToForm(
      withEpisode,
      {
        season_number: 3,
        name: "فصل 3",
        episodes: [{ season_number: 3, episode_number: 1, title: "یک" }],
      },
      { appendMissing: true },
    );

    expect(withSeason.seasons.map((item) => item.season_number)).toEqual(["2", "3"]);
    expect(withSeason.seasons[1]?.episodes[0]?.hls_url).toBe("");
  });
});

describe("mixed series playback", () => {
  it("keeps an MP4 series on MP4 even when an HLS root is already stored", () => {
    expect(inferSeriesPlaybackProtocol([season([episode()])])).toBe("mp4");
    expect(
      inferSeriesPlaybackProtocol(
        [season([episode()])],
        "http://cinema.af/content2/Fallout",
      ),
    ).toBe("mp4");
    expect(
      inferSeriesPlaybackProtocol([
        season([
          episode({ source_method: "hls", hls_url: "http://cdn.example/episode-14/master.m3u8" }),
          episode({ id: "episode-2", episode_number: "2" }),
        ]),
      ]),
    ).toBe("mp4");
  });

  it("imports continuation episodes as HLS without converting published MP4 rows", () => {
    const form = {
      hls_base_url: "http://cinema.af/content2/Fallout",
      playback_protocol: "mp4" as const,
    };

    expect(
      resolveMergedEpisodeSourceMethod(
        {
          source_method: "url",
          video_url: "http://cdn.example/s01e01.mp4",
          embed_url: "",
          hls_url: "",
        },
        form,
      ),
    ).toBe("url");

    expect(
      resolveMergedEpisodeSourceMethod(
        {
          source_method: "url",
          video_url: "",
          embed_url: "",
          hls_url: "",
        },
        form,
      ),
    ).toBe("hls");

    expect(
      resolveMergedEpisodeSourceMethod(undefined, {
        hls_base_url: "",
        playback_protocol: "mp4",
      }),
    ).toBe("url");
  });

  it("does not turn a saved MP4 episode into HLS just because an HLS url is also present", () => {
    const saved = episode({
      video_url: "http://cdn.example/s01e01.mp4",
      hls_url: "http://cinema.af/content2/Fallout/season-01/episode-01/master.m3u8",
    });
    const payload = buildEpisodeUpsertPayload(saved, season([saved]), {
      hls_base_url: "http://cinema.af/content2/Fallout",
      publish_status: "published",
    } as Pick<SeriesFormState, "hls_base_url" | "publish_status">);

    expect(payload.source_method).toBe("url");
    expect(payload.video_url).toBe("http://cdn.example/s01e01.mp4");
    expect(payload.hls_url).toBeNull();
  });

  it("validates direct-video urls on the episode itself", () => {
    const issues = validateSeriesSeasonsTab({
      playback_protocol: "hls",
      seasons: [
        season([
          episode({ video_url: "not-a-video" }),
          episode({
            id: "episode-2",
            episode_number: "2",
            source_method: "hls",
            video_url: "",
          }),
        ]),
      ],
    });

    expect(issues.map((issue) => issue.field)).toEqual([
      "episode:season-1:episode-1:video_url",
    ]);
  });
});
