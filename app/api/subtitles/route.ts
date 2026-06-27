import { fetchWithPlaybackTimeout } from "../../lib/playback-fetch";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Origin, Content-Type",
  Vary: "Origin",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");

  if (!src) {
    return new Response("Missing src", { status: 400, headers: CORS_HEADERS });
  }

  try {
    const upstream = await fetchWithPlaybackTimeout(src, {
      headers: { "User-Agent": "Cinema-SubtitleProxy/1.0" },
    });

    if (!upstream.ok) {
      return new Response("Upstream subtitle fetch failed", {
        status: upstream.status,
        headers: CORS_HEADERS,
      });
    }

    const body = await upstream.text();

    return new Response(body, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/vtt; charset=utf-8",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "max-age=300, private",
      },
    });
  } catch {
    return new Response("Subtitle proxy error", {
      status: 502,
      headers: CORS_HEADERS,
    });
  }
}
