"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  getImageAlt,
  HERO_IMAGE_SIZES,
  isManagedImageUrl,
  resolveHeroBackdropImage,
  stripImageQueryParams,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";

export type HeroBackdropImageProps = {
  image?: ResponsiveImageAsset | null;
  src?: string | null;
  fallbackSrc?: string | null;
  alt?: string;
  title?: string | null;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  className?: string;
  wrapperClassName?: string;
  overlay?: ReactNode;
  placeholderPath?: string;
};

const HERO_IMG_STYLE: CSSProperties = {
  position: "absolute",
  height: "100%",
  width: "100%",
  inset: 0,
  color: "transparent",
};

/** Keep blur visible; only force-open if medium never fires onLoad. */
const LOAD_FAIL_OPEN_MS = 12000;
/** Give LQIP a short exclusive window before the sharp hero starts. */
const MEDIUM_DEFER_MS = 120;

export default function HeroBackdropImage({
  image,
  src,
  fallbackSrc,
  alt,
  title,
  priority = true,
  fetchPriority,
  className = "",
  wrapperClassName = "",
  overlay,
  placeholderPath = "/placeholders/backdrop.svg",
}: HeroBackdropImageProps) {
  const [mediumLoaded, setMediumLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [useBareManaged, setUseBareManaged] = useState(false);
  const [allowMedium, setAllowMedium] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const resolved = resolveHeroBackdropImage({ image, src, fallbackSrc });
  const resolvedAlt = alt ?? getImageAlt({ title, role: "backdrop" });

  const bareManagedSrc =
    resolved.src && isManagedImageUrl(resolved.src)
      ? stripImageQueryParams(resolved.src)
      : null;

  const displaySrc = errored
    ? placeholderPath
    : useBareManaged && bareManagedSrc
      ? bareManagedSrc
      : resolved.src;
  const displaySrcSet =
    errored || useBareManaged ? undefined : resolved.srcSet;
  const blurSrc = errored ? undefined : resolved.blur;

  useEffect(() => {
    setMediumLoaded(false);
    setErrored(false);
    setUseBareManaged(false);
    setAllowMedium(!resolved.blur);
  }, [resolved.src, resolved.blur]);

  useEffect(() => {
    if (allowMedium) {
      return;
    }

    const timer = window.setTimeout(() => setAllowMedium(true), MEDIUM_DEFER_MS);
    return () => window.clearTimeout(timer);
  }, [allowMedium, resolved.src]);

  useEffect(() => {
    if (!allowMedium || !displaySrc) {
      return;
    }

    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setMediumLoaded(true);
    }
  }, [displaySrc, allowMedium]);

  useEffect(() => {
    if (mediumLoaded || !displaySrc || !allowMedium) {
      return;
    }

    const timer = window.setTimeout(() => setMediumLoaded(true), LOAD_FAIL_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [mediumLoaded, displaySrc, allowMedium]);

  const handleLoad = useCallback(() => {
    setMediumLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (
      !useBareManaged &&
      bareManagedSrc &&
      resolved.src &&
      bareManagedSrc !== resolved.src
    ) {
      setUseBareManaged(true);
      setMediumLoaded(false);
      return;
    }

    if (!errored) {
      setErrored(true);
      setMediumLoaded(true);
    }
  }, [bareManagedSrc, errored, resolved.src, useBareManaged]);

  if (!displaySrc && !blurSrc) {
    return (
      <div
        className={`absolute inset-0 size-full overflow-hidden bg-[#05070b] ${wrapperClassName}`}
        role="img"
        aria-label={resolvedAlt}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 size-full overflow-hidden bg-[#05070b] ${wrapperClassName}`}
    >
      {/* LQIP — soft blur only (scale is for blur edge bleed, not ken-burns). */}
      {blurSrc ? (
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className={`absolute inset-0 size-full object-cover object-center blur-xl scale-110 transition-opacity duration-700 ease-out pointer-events-none ${
            mediumLoaded ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : !mediumLoaded && displaySrc && allowMedium ? (
        <img
          src={displaySrc}
          alt=""
          aria-hidden
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-center blur-2xl scale-110 opacity-100 pointer-events-none"
        />
      ) : !mediumLoaded ? (
        <div className="absolute inset-0 bg-[#0a0e16]" aria-hidden />
      ) : null}

      {/* Sharp hero — fills frame, no zoom animation. */}
      {allowMedium && displaySrc ? (
        <img
          ref={imgRef}
          alt={resolvedAlt}
          decoding="async"
          data-nimg="fill"
          sizes={HERO_IMAGE_SIZES}
          srcSet={displaySrcSet}
          src={displaySrc}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={fetchPriority ?? (priority ? "high" : "low")}
          onLoad={handleLoad}
          onError={handleError}
          className={`object-cover object-center transition-opacity duration-700 ease-out ${
            mediumLoaded ? "opacity-100" : "opacity-0"
          } ${className}`.trim()}
          style={HERO_IMG_STYLE}
        />
      ) : null}

      {overlay}
    </div>
  );
}
