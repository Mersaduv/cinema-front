/**
 * Responsive image utilities — REST/GraphQL normalization, URL building, srcset, alt, sizes.
 */

export type ResponsiveSrcsetItem = {
  url: string;
  width: number;
  descriptor?: string;
};

export type ResponsiveImageAsset = {
  original?: string | null;
  blur?: string | null;
  src?: string | null;
  srcset?: ResponsiveSrcsetItem[];
  srcset_string?: string | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
};

export type ImageUsage =
  | "poster-grid"
  | "poster-card"
  | "hero-backdrop"
  | "detail-backdrop"
  | "detail-poster"
  | "person-card"
  | "episode-card"
  | "episode-detail"
  | "collection-card"
  | "genre-icon"
  | "logo";

export type NormalizedImageInput = {
  image?: ResponsiveImageAsset | null;
  url?: string | null;
  fallbackUrl?: string | null;
  alt?: string;
};

const TMDB_HOST_PATTERN = /image\.tmdb\.org/i;

const IMAGE_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_IMAGE_BASE_URL ||
  process.env.NEXT_PUBLIC_CDN_ORIGIN ||
  ""
)
  .trim()
  .replace(/\/$/, "");

export const IMAGE_SIZES: Record<ImageUsage, string> = {
  "poster-grid":
    "(min-width: 1920px) 274px, (min-width: 1280px) 14.28vw, (min-width: 1024px) 16.66vw, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 33.33vw",
  "poster-card":
    "(min-width: 1280px) 14.28vw, (min-width: 1024px) 16.66vw, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 33.33vw",
  "hero-backdrop": "100vw",
  "detail-backdrop": "100vw",
  "detail-poster": "(min-width: 1024px) 320px, (min-width: 768px) 280px, 60vw",
  "person-card": "(min-width: 1024px) 160px, (min-width: 640px) 140px, 33vw",
  "episode-card": "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  "episode-detail": "(min-width: 1024px) 70vw, 100vw",
  "collection-card":
    "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw",
  "genre-icon": "64px",
  logo: "(max-width: 640px) 120px, 200px",
};

export const PLACEHOLDER_PATHS = {
  poster: "/placeholders/poster.svg",
  backdrop: "/placeholders/backdrop.svg",
  person: "/placeholders/person.svg",
  episode: "/placeholders/episode.svg",
  collection: "/placeholders/collection.svg",
  genre: "/placeholders/genre.svg",
} as const;

export function isTmdbImageUrl(url: string | null | undefined): boolean {
  return Boolean(url && TMDB_HOST_PATTERN.test(url));
}

export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (url == null) {
    return null;
  }

  const trimmed = String(url).trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return IMAGE_BASE_URL ? `${IMAGE_BASE_URL}${path}` : path;
}

export function buildSrcSetString(
  image?: ResponsiveImageAsset | null,
): string | undefined {
  if (!image) {
    return undefined;
  }

  if (image.srcset_string?.trim()) {
    return rewriteSrcSetString(image.srcset_string.trim());
  }

  if (!image.srcset?.length) {
    return undefined;
  }

  return image.srcset
    .map((item) => {
      const url = normalizeImageUrl(item.url);
      const descriptor = item.descriptor || `${item.width}w`;

      return url ? `${url} ${descriptor}` : null;
    })
    .filter(Boolean)
    .join(", ");
}

function rewriteSrcSetString(srcset: string): string {
  return srcset
    .split(",")
    .map((part) => {
      const trimmed = part.trim();

      if (!trimmed) {
        return null;
      }

      const separatorIndex = trimmed.search(/\s/);
      const rawUrl = separatorIndex === -1 ? trimmed : trimmed.slice(0, separatorIndex);
      const descriptor = separatorIndex === -1 ? "" : trimmed.slice(separatorIndex);
      const url = normalizeImageUrl(rawUrl);

      return url ? `${url}${descriptor}` : null;
    })
    .filter(Boolean)
    .join(", ");
}

/** Admin form preview: managed CDN first, then TMDB/external while ingestion is pending. */
export function pickAdminPreviewImageSrc(
  image?: ResponsiveImageAsset | null,
  ...fallbackUrls: Array<string | null | undefined>
): string | null {
  const managed = pickImageSrc(image, ...fallbackUrls);

  if (managed) {
    return managed;
  }

  for (const candidate of fallbackUrls) {
    const normalized = normalizeImageUrl(candidate);

    if (!normalized) {
      continue;
    }

    if (
      isTmdbImageUrl(normalized) ||
      normalized.startsWith("http://") ||
      normalized.startsWith("https://")
    ) {
      return normalized;
    }
  }

  return null;
}

export function preferRenderableUrl(
  ...candidates: Array<string | null | undefined>
): string | null {
  const normalized = candidates
    .map((candidate) => normalizeImageUrl(candidate))
    .filter((candidate): candidate is string => Boolean(candidate));

  const internal = normalized.find(
    (candidate) =>
      candidate.startsWith("/images/") ||
      (IMAGE_BASE_URL && candidate.startsWith(`${IMAGE_BASE_URL}/images/`)),
  );

  if (internal) {
    return internal;
  }

  return null;
}

/** Profile photos: never render raw TMDB URLs — managed /images/ only. */
export function pickProfileImageSrc(
  image?: ResponsiveImageAsset | null,
  profileUrl?: string | null,
): string | null {
  if (image?.src) {
    const normalized = normalizeImageUrl(image.src);

    if (normalized && isManagedImageUrl(normalized)) {
      return normalized;
    }
  }

  if (image?.original) {
    const normalized = normalizeImageUrl(image.original);

    if (normalized && isManagedImageUrl(normalized)) {
      return normalized;
    }
  }

  if (profileUrl) {
    const normalized = normalizeImageUrl(profileUrl);

    if (normalized && isManagedImageUrl(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function pickProfileSrcSet(
  image?: ResponsiveImageAsset | null,
): string | undefined {
  if (!image) {
    return undefined;
  }

  const srcset = buildSrcSetString(image);

  if (!srcset) {
    return undefined;
  }

  const firstUrl = srcset.split(/\s+/)[0];

  return firstUrl && isManagedImageUrl(firstUrl) ? srcset : undefined;
}

export function pickImageSrc(
  image?: ResponsiveImageAsset | null,
  ...fallbackUrls: Array<string | null | undefined>
): string | null {
  if (image?.src) {
    const normalized = normalizeImageUrl(image.src);

    if (normalized && !shouldSkipProcessed(image, normalized)) {
      return normalized;
    }
  }

  if (image?.original) {
    const normalized = normalizeImageUrl(image.original);

    if (normalized && !shouldSkipProcessed(image, normalized)) {
      return normalized;
    }
  }

  return preferRenderableUrl(...fallbackUrls);
}

function shouldSkipProcessed(
  image: ResponsiveImageAsset,
  candidate: string,
): boolean {
  return (
    isTmdbImageUrl(candidate) &&
    Boolean(image.src || image.original) &&
    !candidate.includes("/images/")
  );
}

export function pickBlurSrc(
  image?: ResponsiveImageAsset | null,
): string | undefined {
  const blur = image?.blur ? normalizeImageUrl(image.blur) : undefined;

  return blur ?? undefined;
}

export function getImageSizes(usage: ImageUsage, options?: { isTv?: boolean }): string {
  if (options?.isTv && usage === "poster-grid") {
    return "(min-width: 1920px) 274px, (min-width: 1280px) 14.28vw, (min-width: 1024px) 16.66vw, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 33.33vw";
  }

  return IMAGE_SIZES[usage];
}

export type ImageAltContext = {
  kind?: "movie" | "series" | "episode" | "season" | "person" | "collection" | "genre" | "logo";
  title?: string | null;
  name?: string | null;
  role?: "poster" | "backdrop" | "still" | "profile" | "banner" | "logo" | "genre";
  seasonNumber?: number | null;
  episodeNumber?: number | null;
};

export function getImageAlt(context: ImageAltContext): string {
  const title = (context.title || context.name || "").trim();

  switch (context.role) {
    case "poster":
      return title ? `${title} poster` : "Poster";
    case "backdrop":
    case "banner":
      return title ? `${title} backdrop` : "Backdrop";
    case "still":
      if (title && context.seasonNumber != null && context.episodeNumber != null) {
        return `${title} S${context.seasonNumber}E${context.episodeNumber} still`;
      }
      return title ? `${title} episode still` : "Episode still";
    case "profile":
      return title ? `${title} profile photo` : "Profile photo";
    case "genre":
      return title ? `${title} genre artwork` : "Genre artwork";
    case "logo":
      return title ? `${title} logo` : "Logo";
    default:
      return title || "Image";
  }
}

export function normalizeImageAsset(
  raw: unknown,
): ResponsiveImageAsset | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  if (!record.original && !record.src && !record.srcset_string && !record.srcset) {
    return null;
  }

  return {
    original: (record.original as string) ?? null,
    blur: (record.blur as string) ?? null,
    src: (record.src as string) ?? null,
    srcset: Array.isArray(record.srcset)
      ? (record.srcset as ResponsiveSrcsetItem[])
      : undefined,
    srcset_string: (record.srcset_string as string) ?? null,
    width: typeof record.width === "number" ? record.width : null,
    height: typeof record.height === "number" ? record.height : null,
    mime_type: (record.mime_type as string) ?? null,
  };
}

export function normalizeImageInputFromRecord(
  record: Record<string, unknown>,
  imageKey: string,
  urlKey: string,
  fallbackUrlKey?: string,
): NormalizedImageInput {
  const image = normalizeImageAsset(record[imageKey]);
  const url = (record[urlKey] as string) ?? null;
  const fallbackUrl = fallbackUrlKey
    ? ((record[fallbackUrlKey] as string) ?? null)
    : null;

  return {
    image,
    url: preferRenderableUrl(image?.src, image?.original, url) ?? url,
    fallbackUrl: fallbackUrl ?? undefined,
  };
}

export function resolveRenderableImage(input: NormalizedImageInput): {
  src: string | null;
  blur?: string;
  srcSet?: string;
  original?: string | null;
} {
  const src = pickImageSrc(input.image, input.url, input.fallbackUrl);

  return {
    src,
    blur: pickBlurSrc(input.image),
    srcSet: buildSrcSetString(input.image),
    original: normalizeImageUrl(input.image?.original ?? input.url ?? null),
  };
}

/** @deprecated use pickImageSrc + normalizeImageUrl */
export type ResponsiveImage = ResponsiveImageAsset;

export const POSTER_GRID_SIZES = IMAGE_SIZES["poster-grid"];
export const HERO_IMAGE_SIZES = IMAGE_SIZES["hero-backdrop"];
export const DETAIL_POSTER_SIZES = IMAGE_SIZES["detail-poster"];

/** Hero/backdrop variant widths — matches production hero srcset pattern. */
export const HERO_BACKDROP_WIDTHS = [
  640, 750, 828, 1080, 1200, 1920, 2048, 3840,
] as const;

export const HERO_BACKDROP_QUALITY = 85;
export const HERO_BACKDROP_SHARPEN = 60;
export const HERO_BACKDROP_BLUR_QUALITY = 10;
export const HERO_BACKDROP_BLUR_SHARPEN = 0;
export const HERO_BACKDROP_FALLBACK_WIDTH = 3840;

export function stripImageQueryParams(url: string): string {
  const trimmed = url.trim();
  const queryIndex = trimmed.indexOf("?");

  if (queryIndex === -1) {
    return trimmed;
  }

  return trimmed.slice(0, queryIndex);
}

export function isManagedImageUrl(url: string | null | undefined): boolean {
  const normalized = normalizeImageUrl(url);

  if (!normalized) {
    return false;
  }

  if (normalized.startsWith("/images/")) {
    return true;
  }

  if (IMAGE_BASE_URL && normalized.startsWith(`${IMAGE_BASE_URL}/images/`)) {
    return true;
  }

  // Absolute CDN/host URLs whose path is under /images/ (e.g. http://cinema.af/images/...)
  try {
    if (/^https?:\/\//i.test(normalized)) {
      const pathname = new URL(normalized).pathname;
      return pathname.startsWith("/images/");
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Normalize managed image URLs to the relative public path used in admin form fields.
 * Examples:
 *   /images/2026/a.jpg
 *   http://cinema.af/images/2026/a.jpg?width=384 → /images/2026/a.jpg
 * Returns null for TMDB/remote or non-managed URLs.
 */
export function toManagedImagePublicPath(
  url: string | null | undefined,
): string | null {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) {
    return null;
  }

  const bare = stripImageQueryParams(raw);
  if (!bare || !isManagedImageUrl(bare)) {
    return null;
  }

  if (bare.startsWith("/images/")) {
    return bare;
  }

  if (IMAGE_BASE_URL && bare.startsWith(`${IMAGE_BASE_URL}/images/`)) {
    return bare.slice(IMAGE_BASE_URL.length);
  }

  try {
    if (/^https?:\/\//i.test(bare)) {
      const pathname = new URL(bare).pathname;
      return pathname.startsWith("/images/") ? pathname : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function appendImageVariantParams(
  baseUrl: string,
  options: { width: number; quality: number; sharpen: number },
): string {
  const base = stripImageQueryParams(baseUrl);
  const separator = base.includes("?") ? "&" : "?";

  return `${base}${separator}width=${options.width}&quality=${options.quality}&sharpen=${options.sharpen}`;
}

/** Default responsive presets when API only returns a bare /images/ URL. */
export const USAGE_VARIANT_PRESETS: Record<
  ImageUsage,
  { widths: number[]; quality: number; sharpen: number; defaultWidth: number }
> = {
  "poster-grid": {
    widths: [256, 384, 640, 750],
    quality: 65,
    sharpen: 60,
    defaultWidth: 384,
  },
  "poster-card": {
    widths: [256, 384, 640],
    quality: 65,
    sharpen: 60,
    defaultWidth: 384,
  },
  "detail-poster": {
    widths: [384, 640, 750, 1080],
    quality: 70,
    sharpen: 60,
    defaultWidth: 640,
  },
  "detail-backdrop": {
    widths: [640, 1080, 1920, 2048],
    quality: 75,
    sharpen: 60,
    defaultWidth: 1280,
  },
  "hero-backdrop": {
    widths: [...HERO_BACKDROP_WIDTHS],
    quality: HERO_BACKDROP_QUALITY,
    sharpen: HERO_BACKDROP_SHARPEN,
    defaultWidth: 1920,
  },
  "person-card": {
    widths: [160, 256, 384],
    quality: 65,
    sharpen: 60,
    defaultWidth: 256,
  },
  "episode-card": {
    widths: [320, 640, 750],
    quality: 65,
    sharpen: 60,
    defaultWidth: 640,
  },
  "episode-detail": {
    widths: [640, 1080, 1280],
    quality: 70,
    sharpen: 60,
    defaultWidth: 1080,
  },
  "collection-card": {
    widths: [256, 384, 640],
    quality: 65,
    sharpen: 60,
    defaultWidth: 384,
  },
  "genre-icon": {
    widths: [64, 128, 256],
    quality: 80,
    sharpen: 40,
    defaultWidth: 128,
  },
  logo: {
    widths: [120, 200, 320],
    quality: 80,
    sharpen: 40,
    defaultWidth: 200,
  },
};

function hasWidthQuery(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  return /[?&]width=\d+/i.test(url);
}

/**
 * Ensure managed /images/ URLs always carry movieland-style width/quality/sharpen
 * variants — even when API only returned a bare original URL.
 */
export function ensureOptimizedImageAsset(
  image?: ResponsiveImageAsset | null,
  src?: string | null,
  usage: ImageUsage = "poster-card",
): ResponsiveImageAsset | null {
  const existingSrcset = buildSrcSetString(image);

  if (existingSrcset && image) {
    return image;
  }

  const baseCandidate =
    pickHeroBackdropBaseUrl(image, src) ??
    (isManagedImageUrl(src)
      ? stripImageQueryParams(normalizeImageUrl(src) ?? "")
      : null);

  if (!baseCandidate || !isManagedImageUrl(baseCandidate)) {
    if (image) {
      return image;
    }

    if (src?.trim()) {
      return { original: src, src };
    }

    return null;
  }

  const base = stripImageQueryParams(baseCandidate);
  const preset = USAGE_VARIANT_PRESETS[usage];
  const srcset_string = preset.widths
    .map(
      (width) =>
        `${appendImageVariantParams(base, {
          width,
          quality: preset.quality,
          sharpen: preset.sharpen,
        })} ${width}w`,
    )
    .join(", ");

  const optimizedSrc = hasWidthQuery(image?.src)
    ? (normalizeImageUrl(image?.src) ?? image?.src ?? null)
    : appendImageVariantParams(base, {
        width: preset.defaultWidth,
        quality: preset.quality,
        sharpen: preset.sharpen,
      });

  const blur =
    pickBlurSrc(image) ??
    appendImageVariantParams(base, {
      width: 20,
      quality: 10,
      sharpen: 0,
    });

  return {
    ...image,
    original: image?.original ?? base,
    src: optimizedSrc,
    blur,
    srcset_string,
  };
}

/** Optimize a single managed URL for <video poster> / raw <img> (no srcset). */
export function optimizeManagedImageUrl(
  url: string | null | undefined,
  options?: { width?: number; quality?: number; sharpen?: number },
): string | null {
  const normalized = normalizeImageUrl(url);

  if (!normalized) {
    return null;
  }

  if (!isManagedImageUrl(normalized)) {
    return normalized;
  }

  return appendImageVariantParams(stripImageQueryParams(normalized), {
    width: options?.width ?? 1280,
    quality: options?.quality ?? 70,
    sharpen: options?.sharpen ?? 60,
  });
}

export function pickHeroBackdropBaseUrl(
  image?: ResponsiveImageAsset | null,
  src?: string | null,
  fallbackSrc?: string | null,
): string | null {
  const candidates = [
    image?.original,
    image?.src,
    src,
    fallbackSrc,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);

    if (!normalized) {
      continue;
    }

    if (isManagedImageUrl(normalized)) {
      return stripImageQueryParams(normalized);
    }
  }

  return preferRenderableUrl(...candidates);
}

export function buildHeroBackdropSrcSetString(
  baseUrl: string,
): string {
  return HERO_BACKDROP_WIDTHS.map(
    (width) =>
      `${appendImageVariantParams(baseUrl, {
        width,
        quality: HERO_BACKDROP_QUALITY,
        sharpen: HERO_BACKDROP_SHARPEN,
      })} ${width}w`,
  ).join(", ");
}

export function buildHeroBackdropSrc(baseUrl: string): string {
  return appendImageVariantParams(baseUrl, {
    width: HERO_BACKDROP_FALLBACK_WIDTH,
    quality: HERO_BACKDROP_QUALITY,
    sharpen: HERO_BACKDROP_SHARPEN,
  });
}

export function buildHeroBackdropBlurSrc(
  image?: ResponsiveImageAsset | null,
  baseUrl?: string | null,
): string | undefined {
  const blurFromImage = pickBlurSrc(image);

  if (blurFromImage) {
    return blurFromImage;
  }

  if (baseUrl && isManagedImageUrl(baseUrl)) {
    return appendImageVariantParams(baseUrl, {
      width: 20,
      quality: HERO_BACKDROP_BLUR_QUALITY,
      sharpen: HERO_BACKDROP_BLUR_SHARPEN,
    });
  }

  return undefined;
}

export function resolveHeroBackdropImage(input: {
  image?: ResponsiveImageAsset | null;
  src?: string | null;
  fallbackSrc?: string | null;
}): {
  baseUrl: string | null;
  src: string | null;
  srcSet?: string;
  blur?: string;
} {
  const baseUrl = pickHeroBackdropBaseUrl(
    input.image,
    input.src,
    input.fallbackSrc,
  );

  if (!baseUrl) {
    return { baseUrl: null, src: null };
  }

  if (isManagedImageUrl(baseUrl)) {
    const stripped = stripImageQueryParams(baseUrl);

    return {
      baseUrl: stripped,
      src: buildHeroBackdropSrc(stripped),
      srcSet: buildHeroBackdropSrcSetString(stripped),
      blur: buildHeroBackdropBlurSrc(input.image, stripped),
    };
  }

  return {
    baseUrl,
    src: baseUrl,
    blur: pickBlurSrc(input.image),
  };
}

export function pickPosterFromItem(item: {
  poster_url?: string | null;
  backdrop_url?: string | null;
  poster_image?: ResponsiveImageAsset | null;
  backdrop_image?: ResponsiveImageAsset | null;
}) {
  const resolved = resolveRenderableImage({
    image: item.poster_image,
    url: item.poster_url,
    fallbackUrl: item.backdrop_url,
  });

  return {
    src: resolved.src,
    blur: resolved.blur,
    srcSet: resolved.srcSet,
    sizes: POSTER_GRID_SIZES,
  };
}

export function pickBackdropFromItem(item: {
  backdrop_url?: string | null;
  poster_url?: string | null;
  backdrop_image?: ResponsiveImageAsset | null;
}) {
  const resolved = resolveRenderableImage({
    image: item.backdrop_image,
    url: item.backdrop_url,
    fallbackUrl: item.poster_url,
  });

  return {
    src: resolved.src,
    blur: resolved.blur,
    srcSet: resolved.srcSet,
    sizes: HERO_IMAGE_SIZES,
  };
}

export function pickProfileFromItem(item: {
  profile_url?: string | null;
  profile_image?: ResponsiveImageAsset | null;
}) {
  const resolved = resolveRenderableImage({
    image: item.profile_image,
    url: item.profile_url,
  });

  return {
    src: resolved.src,
    blur: resolved.blur,
    srcSet: resolved.srcSet,
    sizes: IMAGE_SIZES["person-card"],
  };
}
