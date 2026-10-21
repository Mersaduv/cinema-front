import { fetchWithPlaybackTimeout } from "../../lib/playback-fetch";
import { isRateLimited } from "../../lib/simple-rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Origin, Content-Type",
  Vary: "Origin",
};

function looksLikeSrt(body: string, src: string): boolean {
  const path = (() => {
    try {
      return new URL(src).pathname.toLowerCase();
    } catch {
      return src.toLowerCase();
    }
  })();

  if (/\.srt(\?|$)/i.test(path)) {
    return true;
  }

  const trimmed = body.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (trimmed.startsWith("WEBVTT")) {
    return false;
  }

  return /^\d+\s*\n\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->/m.test(trimmed);
}

/** Convert SRT timestamps (comma) to WebVTT (dot) and wrap with WEBVTT header. */
function srtToWebVtt(body: string): string {
  const normalized = body.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  const cues = normalized
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const timeIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeIndex < 0) {
        return null;
      }

      const timeLine = lines[timeIndex].replace(/(\d),(\d)/g, "$1.$2");
      const text = lines.slice(timeIndex + 1).join("\n").trim();
      if (!text) {
        return null;
      }

      return `${timeLine}\n${text}`;
    })
    .filter((cue): cue is string => Boolean(cue));

  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : "unknown";

  if (isRateLimited(`subtitles:${ip}`, 20, 60_000)) {
    return new Response("Too many requests", {
      status: 429,
      headers: CORS_HEADERS,
    });
  }

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

    const rawBody = await upstream.text();
    const isSrt = looksLikeSrt(rawBody, src);
    // Convert SRT → WebVTT so native <track> and managed SubtitleEngine both work.
    const body = isSrt ? srtToWebVtt(rawBody) : rawBody;

    return new Response(body, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/vtt; charset=utf-8",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "max-age=300, private",
        ...(isSrt ? { "X-Cinema-Subtitle-Format": "vtt-from-srt" } : {}),
      },
    });
  } catch {
    return new Response("Subtitle proxy error", {
      status: 502,
      headers: CORS_HEADERS,
    });
  }
}
