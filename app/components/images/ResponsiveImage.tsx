"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildSrcSetString,
  ensureOptimizedImageAsset,
  getImageSizes,
  isManagedImageUrl,
  isTmdbImageUrl,
  normalizeImageUrl,
  pickBlurSrc,
  pickImageSrc,
  type ImageUsage,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";

export type ResponsiveImageProps = {
  image?: ResponsiveImageAsset | null;
  src?: string | null;
  fallbackUrl?: string | null;
  alt: string;
  usage?: ImageUsage;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  objectFit?: "cover" | "contain";
  aspectRatio?: string;
  placeholderPath?: string;
  className?: string;
  wrapperClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  draggable?: boolean;
  /** Admin preview: show TMDB/external fallback when managed src is not ready yet. */
  allowRemoteFallback?: boolean;
};

export default function ResponsiveImage({
  image,
  src,
  fallbackUrl,
  alt,
  usage,
  sizes,
  loading = "lazy",
  fetchPriority,
  objectFit = "cover",
  aspectRatio,
  placeholderPath,
  className = "",
  wrapperClassName = "",
  fill = false,
  width,
  height,
  draggable,
  allowRemoteFallback = false,
}: ResponsiveImageProps) {
  const isTvCompat = useIsTvCompat();
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedImage = useMemo(
    () =>
      ensureOptimizedImageAsset(
        image,
        src ?? fallbackUrl,
        usage ?? "poster-card",
      ),
    [fallbackUrl, image, src, usage],
  );

  const primarySrc = useMemo(
    () => pickImageSrc(optimizedImage, src, fallbackUrl),
    [optimizedImage, src, fallbackUrl],
  );
  const normalizedFallback = useMemo(
    () => normalizeImageUrl(fallbackUrl),
    [fallbackUrl],
  );

  const resolvedSrc = errored
    ? (placeholderPath ?? null)
    : useFallback && normalizedFallback && normalizedFallback !== primarySrc
      ? normalizedFallback
      : (primarySrc ??
        (allowRemoteFallback ? normalizedFallback : null) ??
        placeholderPath ??
        null);

  const blurSrc = errored || useFallback ? undefined : pickBlurSrc(optimizedImage);
  const srcSet =
    errored || useFallback ? undefined : buildSrcSetString(optimizedImage);
  const sizesAttr = sizes ?? (usage ? getImageSizes(usage, { isTv: isTvCompat }) : undefined);
  const objectFitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  useEffect(() => {
    setUseFallback(false);
    setErrored(false);
    setLoaded(false);
  }, [primarySrc, normalizedFallback]);

  // Handle already-cached images: browser won't fire onLoad again
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      void Promise.resolve().then(() => setLoaded(true));
    }
  }, [resolvedSrc]);

  const handleLoad = useCallback(() => setLoaded(true), []);

  const handleError = useCallback(() => {
    if (
      !useFallback &&
      primarySrc &&
      isManagedImageUrl(primarySrc) &&
      normalizedFallback &&
      (isTmdbImageUrl(normalizedFallback) ||
        normalizedFallback.startsWith("http://") ||
        normalizedFallback.startsWith("https://")) &&
      normalizedFallback !== primarySrc
    ) {
      setUseFallback(true);
      setLoaded(false);
      return;
    }

    if (!errored) {
      setErrored(true);
      setLoaded(false);
    }
  }, [errored, normalizedFallback, primarySrc, useFallback]);

  if (!resolvedSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-[#12161f] text-xs text-white/35 ${wrapperClassName}`}
        style={aspectRatio ? { aspectRatio } : undefined}
        role="img"
        aria-label={alt}
      >
        {alt}
      </div>
    );
  }

  const fillPositioning = fill ? "absolute inset-0 h-full w-full" : "h-full w-full";

  return (
    <div
      className={`relative overflow-hidden bg-[#12161f] ${fill ? "h-full w-full" : ""} ${wrapperClassName}`}
      style={!fill && aspectRatio ? { aspectRatio } : undefined}
    >
      {blurSrc ? (
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          loading={loading}
          decoding="async"
          fetchPriority={loading === "eager" ? "low" : undefined}
          className={`absolute inset-0 h-full w-full ${objectFitClass} scale-110 blur-xl pointer-events-none transition-opacity duration-300 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}

      <img
        ref={imgRef}
        src={normalizeImageUrl(resolvedSrc) ?? resolvedSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizesAttr : undefined}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={draggable}
        onLoad={handleLoad}
        onError={handleError}
        className={[
          fillPositioning,
          objectFitClass,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
