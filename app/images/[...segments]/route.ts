import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";

const IMAGE_ROOT =
  process.env.CINEMA_IMAGE_STORAGE_ROOT ||
  process.env.NEXT_PUBLIC_CINEMA_IMAGE_STORAGE_ROOT ||
  "E:\\content";

const IMAGE_PREFIX = (
  process.env.NEXT_PUBLIC_CINEMA_IMAGE_PUBLIC_PREFIX || "/images"
).replace(/\/$/, "");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function resolveImagePath(segments: string[]): string | null {
  const decodedSegments = segments.map((segment) => decodeURIComponent(segment));
  const relativePath = [IMAGE_PREFIX.replace(/^\//, ""), ...decodedSegments].join(
    path.sep,
  );
  const absolutePath = path.resolve(IMAGE_ROOT, relativePath);
  const normalizedRoot = path.resolve(IMAGE_ROOT);

  if (
    absolutePath !== normalizedRoot &&
    !absolutePath.startsWith(normalizedRoot + path.sep)
  ) {
    return null;
  }

  return absolutePath;
}

function parseQueryResize(request: NextRequest): {
  width?: number;
  quality?: number;
  sharpen?: number;
} {
  const width = Number(request.nextUrl.searchParams.get("width"));
  const quality = Number(request.nextUrl.searchParams.get("quality"));
  const sharpen = Number(request.nextUrl.searchParams.get("sharpen"));

  return {
    width: Number.isFinite(width) && width > 0 ? width : undefined,
    quality: Number.isFinite(quality) && quality > 0 ? quality : undefined,
    sharpen: Number.isFinite(sharpen) ? sharpen : undefined,
  };
}

async function createFileResponse(absolutePath: string, request: NextRequest) {
  const fileStat = await stat(absolutePath);

  if (!fileStat.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] || "application/octet-stream";
  const resize = parseQueryResize(request);

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": String(fileStat.size),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (resize.width) {
    headers["X-Cinema-Image-Resize"] = JSON.stringify(resize);
  }

  const stream = createReadStream(absolutePath);

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await context.params;
  const absolutePath = resolveImagePath(segments);

  if (!absolutePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await createFileResponse(absolutePath, request);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await context.params;
  const absolutePath = resolveImagePath(segments);

  if (!absolutePath) {
    return new Response(null, { status: 404 });
  }

  try {
    const fileStat = await stat(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();

    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
