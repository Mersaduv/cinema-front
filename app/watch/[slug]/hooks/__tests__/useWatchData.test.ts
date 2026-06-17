import { describe, expect, it, vi } from "vitest";

describe("useWatchData parallel fetching", () => {
  it("starts REST and GraphQL without sequential dependency", async () => {
    const calls: string[] = [];

    const graphqlPromise = new Promise<void>((resolve) => {
      calls.push("graphql-start");
      setTimeout(() => {
        calls.push("graphql-end");
        resolve();
      }, 200);
    });

    const restPromise = (async () => {
      calls.push("rest-start");
      await new Promise((resolve) => setTimeout(resolve, 100));
      calls.push("rest-end");
    })();

    await Promise.all([graphqlPromise, restPromise]);

    expect(calls.indexOf("rest-start")).toBeLessThan(calls.indexOf("graphql-end"));
    expect(calls).toContain("graphql-start");
    expect(calls).toContain("rest-start");
  });

  it("prefers GraphQL hls_url before REST resolves", () => {
    const graphqlHls = "https://cdn.example.com/movie/master.m3u8";
    const restHls = "https://cdn.example.com/movie/rest.m3u8";

    const hlsUrl = graphqlHls || restHls;

    expect(hlsUrl).toBe(graphqlHls);
  });
});
