import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";

const MEDIA_ROOT = process.env.MEDIA_ROOT || "D:\\media";
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".m3u8": "application/vnd.apple.mpegurl; charset=utf-8",
  ".vtt": "text/vtt; charset=utf-8",
  ".ts": "video/mp2t",
  ".aac": "audio/aac",
  ".mp4": "video/mp4",
};

function resolveMediaPath(segments: string[]): string | null {
  const decodedSegments = segments.map((segment) => decodeURIComponent(segment));
  const absolutePath = path.resolve(MEDIA_ROOT, ...decodedSegments);
  const normalizedRoot = path.resolve(MEDIA_ROOT);

  if (
    absolutePath !== normalizedRoot &&
    !absolutePath.startsWith(normalizedRoot + path.sep)
  ) {
    return null;
  }

  return absolutePath;
}

function buildHeaders(contentType: string, size: number, extension: string) {
  const cacheControl =
    extension === ".m3u8" || extension === ".vtt"
      ? "no-store, must-revalidate"
      : "public, max-age=3600";

  return {
    "Content-Type": contentType,
    "Content-Length": String(size),
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
  };
}

async function createFileResponse(
  absolutePath: string,
  request: NextRequest,
  includeBody: boolean
) {
  const fileStat = await stat(absolutePath);

  if (!fileStat.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] || "application/octet-stream";
  const rangeHeader = request.headers.get("range");

  if (process.env.NODE_ENV === "development" && [".m3u8", ".ts"].includes(extension)) {
    console.info("[CinemaMediaRoute]", {
      method: request.method,
      path: absolutePath,
      range: rangeHeader || null,
      includeBody,
    });
  }

  if (!rangeHeader) {
    if (!includeBody) {
      return new Response(null, {
        status: 200,
        headers: buildHeaders(contentType, fileStat.size, extension),
      });
    }

    const stream = createReadStream(absolutePath);

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: buildHeaders(contentType, fileStat.size, extension),
    });
  }

  const [rangeStartRaw, rangeEndRaw] = rangeHeader.replace("bytes=", "").split("-");
  const requestedStart = Number(rangeStartRaw);
  const requestedEnd = rangeEndRaw ? Number(rangeEndRaw) : null;
  const start = Number.isFinite(requestedStart) ? requestedStart : 0;
  const end = Math.min(
    Number.isFinite(requestedEnd as number) ? (requestedEnd as number) : fileStat.size - 1,
    fileStat.size - 1
  );

  if (start > end || start >= fileStat.size) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${fileStat.size}`,
      },
    });
  }

  const chunkLength = end - start + 1;
  const headers = {
    "Content-Type": contentType,
    "Content-Length": String(chunkLength),
    "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
    "Accept-Ranges": "bytes",
    "Cache-Control":
      extension === ".m3u8" || extension === ".vtt"
        ? "no-store, must-revalidate"
        : "public, max-age=3600",
  };

  if (process.env.NODE_ENV === "development" && [".m3u8", ".ts"].includes(extension)) {
    console.info("[CinemaMediaRouteRange]", {
      path: absolutePath,
      start,
      end,
      fileSize: fileStat.size,
      chunkLength,
    });
  }

  if (!includeBody) {
    return new Response(null, {
      status: 206,
      headers,
    });
  }

  const stream = createReadStream(absolutePath, { start, end });

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 206,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await context.params;
  const absolutePath = resolveMediaPath(segments);

  if (!absolutePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await createFileResponse(absolutePath, request, true);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await context.params;
  const absolutePath = resolveMediaPath(segments);

  if (!absolutePath) {
    return new Response(null, { status: 404 });
  }

  try {
    return await createFileResponse(absolutePath, request, false);
  } catch {
    return new Response(null, { status: 404 });
  }
}
