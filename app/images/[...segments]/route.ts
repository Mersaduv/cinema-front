import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";
import {
  shouldTransform,
  transformCinemaImage,
} from "../../lib/cinema-image-transform";

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

const PASSTHROUGH_EXTENSIONS = new Set([".svg", ".gif"]);

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

  // Never serve the on-disk variant cache as a public original path.
  if (absolutePath.includes(`${path.sep}_cache${path.sep}`)) {
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

async function createOriginalResponse(absolutePath: string) {
  const fileStat = await stat(absolutePath);

  if (!fileStat.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] || "application/octet-stream";
  const stream = createReadStream(absolutePath);

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Cinema-Image-Optimized": "0",
    },
  });
}

async function createOptimizedResponse(
  absolutePath: string,
  request: NextRequest,
) {
  const fileStat = await stat(absolutePath);

  if (!fileStat.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const resize = parseQueryResize(request);

  if (PASSTHROUGH_EXTENSIONS.has(extension) || !shouldTransform(resize)) {
    return createOriginalResponse(absolutePath);
  }

  const transformed = await transformCinemaImage(
    absolutePath,
    IMAGE_ROOT,
    resize,
    { mtimeMs: fileStat.mtimeMs, size: fileStat.size },
  );

  return new Response(new Uint8Array(transformed.buffer), {
    status: 200,
    headers: {
      "Content-Type": transformed.contentType,
      "Content-Length": String(transformed.buffer.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=86400",
      Vary: "Accept",
      "X-Cinema-Image-Optimized": "1",
      "X-Cinema-Image-Cache": transformed.cacheHit ? "HIT" : "MISS",
      "X-Cinema-Image-Resize": JSON.stringify(resize),
    },
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
    return await createOptimizedResponse(absolutePath, request);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";

    // Missing originals are expected for stale URLs — return 404 without a stack dump.
    if (code === "ENOENT") {
      try {
        return await createOriginalResponse(absolutePath);
      } catch {
        return new Response("Not found", { status: 404 });
      }
    }

    console.error("[cinema-image] transform failed, falling back to original", error);
    try {
      return await createOriginalResponse(absolutePath);
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
