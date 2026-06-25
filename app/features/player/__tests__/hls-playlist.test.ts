import { describe, expect, it } from "vitest";
import { rewriteM3u8PlaylistBody } from "../../../lib/hls-playlist";

describe("hls-playlist", () => {
  it("rewrites absolute CDN segment URLs to /content2 paths", () => {
    const body = [
      "#EXTM3U",
      "#EXT-X-STREAM-INF:BANDWIDTH=1200000",
      "http://cinema.af/content2/movies/sinners/hls/720p/index.m3u8",
    ].join("\n");

    const rewritten = rewriteM3u8PlaylistBody(
      body,
      "http://cinema.af/content2/movies/sinners/hls/master.m3u8",
    );

    expect(rewritten).toContain("/content2/movies/sinners/hls/720p/index.m3u8");
    expect(rewritten).not.toContain("http://cinema.af/content2/");
  });

  it("rewrites relative variant paths to absolute /content2 paths", () => {
    const body = ["#EXTM3U", "#EXT-X-STREAM-INF:BANDWIDTH=800000", "720p/index.m3u8"].join(
      "\n",
    );

    const rewritten = rewriteM3u8PlaylistBody(
      body,
      "http://cinema.af/content2/movies/sinners/hls/master.m3u8",
    );

    expect(rewritten).toContain("/content2/movies/sinners/hls/720p/index.m3u8");
  });
});
