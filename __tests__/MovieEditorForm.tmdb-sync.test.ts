import { describe, expect, it } from "vitest";

type MovieFormState = {
  tmdb_query: string;
  tmdb_id: string;
  title: string;
  hls_url: string;
  subtitle_source_path: string;
  dubbed_audio_url: string;
  download_links: Record<string, string>;
};

function applyTmdbMoviePreservePlaybackFields(
  current: MovieFormState,
  payload: {
    title?: string | null;
    hls_url?: string | null;
    subtitle_url?: string | null;
    dubbed_audio_url?: string | null;
    download_links?: Record<string, string>;
  },
  query: string,
): MovieFormState {
  return {
    ...current,
    tmdb_query: query,
    title: payload.title || current.title,
    hls_url: current.hls_url,
    subtitle_source_path: current.subtitle_source_path,
    dubbed_audio_url: current.dubbed_audio_url,
    download_links: current.download_links,
  };
}

function shouldAutoFetchTmdb(
  mode: "create" | "edit",
  tmdbCode: string,
  lastFetchedTmdbCode: string,
): boolean {
  if (mode === "edit") {
    return false;
  }

  return Boolean(tmdbCode) && tmdbCode !== lastFetchedTmdbCode;
}

describe("Movie TMDB sync guards", () => {
  it("does not overwrite playback fields from TMDB payload", () => {
    const current: MovieFormState = {
      tmdb_query: "",
      tmdb_id: "42",
      title: "Local title",
      hls_url: "https://cdn.example/movie/master.m3u8",
      subtitle_source_path: "https://cdn.example/sub.vtt",
      dubbed_audio_url: "https://cdn.example/dub.m3u8",
      download_links: { "1080p": "https://cdn.example/dl.mp4" },
    };

    const next = applyTmdbMoviePreservePlaybackFields(
      current,
      {
        title: "TMDB title",
        hls_url: "https://tmdb.example/master.m3u8",
        subtitle_url: "https://tmdb.example/sub.vtt",
        dubbed_audio_url: "https://tmdb.example/dub.m3u8",
        download_links: { "720p": "https://tmdb.example/dl.mp4" },
      },
      "42",
    );

    expect(next.title).toBe("TMDB title");
    expect(next.hls_url).toBe(current.hls_url);
    expect(next.subtitle_source_path).toBe(current.subtitle_source_path);
    expect(next.dubbed_audio_url).toBe(current.dubbed_audio_url);
    expect(next.download_links).toEqual(current.download_links);
  });

  it("prevents duplicate auto-fetch when code unchanged in create mode", () => {
    expect(shouldAutoFetchTmdb("create", "1396", "1396")).toBe(false);
    expect(shouldAutoFetchTmdb("create", "1396", "")).toBe(true);
  });

  it("blocks auto-fetch in edit mode", () => {
    expect(shouldAutoFetchTmdb("edit", "1396", "")).toBe(false);
    expect(shouldAutoFetchTmdb("edit", "1396", "1396")).toBe(false);
  });
});
