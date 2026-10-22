import { describe, expect, it } from "vitest";
import {
  applyCascadedEpisodeHls,
  buildEpisodeHlsPathCandidates,
  buildEmptyEpisodeHlsDiscoveryGroups,
  episodeKeepsExistingPlayback,
  fillEmptyEpisodeHlsFromBases,
} from "../series-hls-paths";

describe("buildEpisodeHlsPathCandidates", () => {
  it("prefers flat episode path before season-nested layout", () => {
    const candidates = buildEpisodeHlsPathCandidates({
      seriesBase: "http://cinema.af/content2/Fallout",
      seasonBase: "",
      seasonNumber: "1",
      episodeNumber: "1",
    });

    expect(candidates[0]).toBe(
      "http://cinema.af/content2/Fallout/episode-01/master.m3u8",
    );
    expect(candidates[1]).toBe(
      "http://cinema.af/content2/Fallout/season-01/episode-01/master.m3u8",
    );
  });

  it("uses explicit season base first when provided", () => {
    const candidates = buildEpisodeHlsPathCandidates({
      seriesBase: "http://cinema.af/content2/Fallout",
      seasonBase: "http://cinema.af/content2/Fallout/season-02",
      seasonNumber: "2",
      episodeNumber: "3",
    });

    expect(candidates[0]).toBe(
      "http://cinema.af/content2/Fallout/season-02/episode-03/master.m3u8",
    );
  });
});

describe("buildEmptyEpisodeHlsDiscoveryGroups", () => {
  it("groups only episodes with empty hls_url by discovery base", () => {
    const groups = buildEmptyEpisodeHlsDiscoveryGroups({
      hls_base_url: "http://cinema.af/content2/Fallout",
      seasons: [
        {
          id: "season-1",
          season_number: "1",
          hls_base_url: "",
          episodes: [
            {
              id: "episode-1",
              episode_number: "1",
              hls_url: "",
              hls_verified: false,
            },
            {
              id: "episode-2",
              episode_number: "2",
              hls_url: "http://custom.example/episode-02/master.m3u8",
              hls_verified: true,
            },
          ],
        },
      ],
    });

    expect(groups).toHaveLength(1);
    expect(groups[0]?.baseUrl).toBe("http://cinema.af/content2/Fallout");
    expect(groups[0]?.episodes).toEqual([{ season: 1, episode: 1 }]);
  });
});

describe("fillEmptyEpisodeHlsFromBases", () => {
  it("fills only episodes with empty hls_url using the first layout candidate", () => {
    const form = {
      hls_base_url: "http://cinema.af/content2/Fallout",
      seasons: [
        {
          id: "season-1",
          season_number: "1",
          hls_base_url: "",
          episodes: [
            {
              id: "episode-1",
              episode_number: "1",
              hls_url: "",
              hls_verified: false,
            },
            {
              id: "episode-2",
              episode_number: "2",
              hls_url: "http://custom.example/episode-02/master.m3u8",
              hls_verified: true,
            },
          ],
        },
      ],
    };

    const { nextForm, filled } = fillEmptyEpisodeHlsFromBases(form);

    expect(filled).toHaveLength(1);
    expect(filled[0]?.hlsUrl).toBe(
      "http://cinema.af/content2/Fallout/episode-01/master.m3u8",
    );
    expect(nextForm.seasons[0]?.episodes[0]?.hls_url).toBe(
      "http://cinema.af/content2/Fallout/episode-01/master.m3u8",
    );
    expect(nextForm.seasons[0]?.episodes[1]?.hls_url).toBe(
      "http://custom.example/episode-02/master.m3u8",
    );
  });
});

describe("applyCascadedEpisodeHls", () => {
  const cascadeInput = {
    previousSeriesBase: "",
    nextSeriesBase: "http://cinema.af/content2/Fallout",
    previousSeasonContext: "",
    seasonBase: "http://cinema.af/content2/Fallout/season-02",
    seasonNumber: "2",
    explicitEpisodeMaster: null,
    explicitEpisodeNumber: null,
  };

  it("keeps episodes that already have a direct video", () => {
    const episode = {
      episode_number: "1",
      source_method: "url" as const,
      video_url: "http://cdn.example/s01e01.mp4",
      embed_url: "",
      hls_url: "",
      hls_verified: false,
    };

    expect(episodeKeepsExistingPlayback(episode)).toBe(true);
    expect(applyCascadedEpisodeHls(episode, cascadeInput)).toEqual(episode);
  });

  it("turns empty direct-video rows into HLS paths from the new root", () => {
    const next = applyCascadedEpisodeHls(
      {
        episode_number: "3",
        source_method: "url" as const,
        video_url: "",
        embed_url: "",
        hls_url: "",
        hls_verified: false,
      },
      cascadeInput,
    );

    expect(next.source_method).toBe("hls");
    expect(next.hls_url).toBe(
      "http://cinema.af/content2/Fallout/season-02/episode-03/master.m3u8",
    );
    expect(next.video_url).toBe("");
  });

  it("does not replace a manual HLS path", () => {
    const next = applyCascadedEpisodeHls(
      {
        episode_number: "3",
        source_method: "hls" as const,
        video_url: "",
        embed_url: "",
        hls_url: "http://custom.example/episode-03/master.m3u8",
        hls_verified: true,
      },
      cascadeInput,
    );

    expect(next.hls_url).toBe("http://custom.example/episode-03/master.m3u8");
    expect(next.hls_verified).toBe(true);
  });
});
