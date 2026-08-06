import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export type ImageTransformParams = {
  width?: number;
  quality?: number;
  sharpen?: number;
};

export type TransformedImage = {
  buffer: Buffer;
  contentType: string;
  cacheHit: boolean;
};

const MAX_WIDTH = 3840;
const MIN_WIDTH = 16;
const DEFAULT_QUALITY = 65;
const MIN_QUALITY = 10;
const MAX_QUALITY = 95;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cacheRoot(imageRoot: string): string {
  return path.join(imageRoot, "images", "_cache");
}

function buildCacheKey(
  absolutePath: string,
  params: Required<Pick<ImageTransformParams, "width" | "quality" | "sharpen">>,
  mtimeMs: number,
  size: number,
): string {
  const payload = [
    absolutePath,
    String(mtimeMs),
    String(size),
    `w${params.width}`,
    `q${params.quality}`,
    `s${params.sharpen}`,
    "webp",
  ].join("|");

  return createHash("sha1").update(payload).digest("hex");
}

/**
 * Movieland-style on-the-fly transform: resize + sharpen + WebP.
 * Disk-caches under {IMAGE_ROOT}/images/_cache/{hash}.webp
 */
export async function transformCinemaImage(
  absolutePath: string,
  imageRoot: string,
  params: ImageTransformParams,
  fileMeta: { mtimeMs: number; size: number },
): Promise<TransformedImage> {
  const width = clamp(Math.round(params.width ?? 0), MIN_WIDTH, MAX_WIDTH);
  const quality = clamp(
    Math.round(params.quality ?? DEFAULT_QUALITY),
    MIN_QUALITY,
    MAX_QUALITY,
  );
  const sharpen = clamp(Math.round(params.sharpen ?? 0), 0, 100);

  const key = buildCacheKey(
    absolutePath,
    { width, quality, sharpen },
    fileMeta.mtimeMs,
    fileMeta.size,
  );
  const cacheDir = cacheRoot(imageRoot);
  const cachePath = path.join(cacheDir, `${key}.webp`);

  try {
    await access(cachePath);
    const buffer = await readFile(cachePath);
    return { buffer, contentType: "image/webp", cacheHit: true };
  } catch {
    // miss — generate
  }

  let pipeline = sharp(absolutePath, {
    failOn: "none",
    sequentialRead: true,
  }).rotate();

  pipeline = pipeline.resize({
    width,
    withoutEnlargement: true,
    fit: "inside",
  });

  if (sharpen > 0) {
    // Map 0–100 UI param to a mild sigma (movieland uses sharpen=60 for thumbs).
    const sigma = Math.max(0.3, (sharpen / 100) * 1.6);
    pipeline = pipeline.sharpen({ sigma });
  }

  const buffer = await pipeline
    .webp({
      quality,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();

  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePath, buffer);

  return { buffer, contentType: "image/webp", cacheHit: false };
}

export function shouldTransform(params: ImageTransformParams): boolean {
  return Boolean(params.width && params.width > 0);
}
