import {
  isHlsManifestUrl,
  resolveCdnOriginForPlaylist,
  rewriteM3u8PlaylistBody,
} from "../../../lib/hls-playlist";
import { STREAMING_RESPONSE_HEADERS } from "../../../lib/playback-networking";

const MANIFEST_HEADERS = {
  ...STREAMING_RESPONSE_HEADERS,
  "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
  "Cache-Control": "no-store",
};

function isAllowedManifestSource(src: string): boolean {
  try {
    const parsed = new URL(src);
    const cdn = new URL(resolveCdnOriginForPlaylist());

    return (
      parsed.hostname === cdn.hostname && parsed.pathname.startsWith("/content2/")
    );
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: MANIFEST_HEADERS });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src")?.trim();

  if (!src || !isHlsManifestUrl(src)) {
    return new Response("Missing or invalid HLS src", {
      status: 400,
      headers: MANIFEST_HEADERS,
    });
  }

  if (!isAllowedManifestSource(src)) {
    return new Response("Manifest source not allowed", {
      status: 403,
      headers: MANIFEST_HEADERS,
    });
  }

  try {
    const upstream = await fetch(src, {
      headers: { Accept: "application/vnd.apple.mpegurl, */*" },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new Response("Upstream manifest fetch failed", {
        status: upstream.status,
        headers: MANIFEST_HEADERS,
      });
    }

    const body = await upstream.text();
    const rewritten = rewriteM3u8PlaylistBody(body, src);

    return new Response(rewritten, {
      status: 200,
      headers: MANIFEST_HEADERS,
    });
  } catch {
    return new Response("Manifest proxy error", {
      status: 502,
      headers: MANIFEST_HEADERS,
    });
  }
}
