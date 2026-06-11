"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildSrcSetString,
  getImageSizes,
  normalizeImageUrl,
  pickBlurSrc,
  pickImageSrc,
  type ImageUsage,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";

export type ResponsiveImageProps = {
  image?: ResponsiveImageAsset | null;
  src?: string | null;
  fallbackUrl?: string | null;
  alt: string;
  usage?: ImageUsage;
  sizes?: string;
  loading?: "lazy" | "eager";
  objectFit?: "cover" | "contain";
  aspectRatio?: string;
  placeholderPath?: string;
  className?: string;
  wrapperClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
};

export default function ResponsiveImage({
  image,
  src,
  fallbackUrl,
  alt,
  usage,
  sizes,
  loading = "lazy",
  objectFit = "cover",
  aspectRatio,
  placeholderPath,
  className = "",
  wrapperClassName = "",
  fill = false,
  width,
  height,
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const resolvedSrc = errored
    ? (placeholderPath ?? null)
    : (pickImageSrc(image, src, fallbackUrl) ?? placeholderPath ?? null);

  const blurSrc = errored ? undefined : pickBlurSrc(image);
  const srcSet = errored ? undefined : buildSrcSetString(image);
  const sizesAttr = sizes ?? (usage ? getImageSizes(usage) : undefined);
  const objectFitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  // Handle already-cached images: browser won't fire onLoad again
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      // Avoid direct setState in the effect body (cached images case)
      void Promise.resolve().then(() => setLoaded(true));
    }
  }, [resolvedSrc]);

  const handleLoad = useCallback(() => setLoaded(true), []);

  const handleError = useCallback(() => {
    if (!errored) {
      setErrored(true);
      setLoaded(false);
    }
  }, [errored]);

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
      {/* Blur layer behind main image */}
      {blurSrc ? (
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          className={`absolute inset-0 h-full w-full ${objectFitClass} scale-110 blur-xl pointer-events-none transition-opacity duration-700 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}

      {/* Main image fades in over blur */}
      <img
        ref={imgRef}
        src={normalizeImageUrl(resolvedSrc) ?? resolvedSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizesAttr : undefined}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={[
          fillPositioning,
          objectFitClass,
          "transition-opacity duration-700",
          loaded ? "opacity-100" : "opacity-0",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
