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
  resolveHeroBackdropImage,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";

export type HeroBackdropImageProps = {
  image?: ResponsiveImageAsset | null;
  src?: string | null;
  fallbackSrc?: string | null;
  alt?: string;
  title?: string | null;
  priority?: boolean;
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

export default function HeroBackdropImage({
  image,
  src,
  fallbackSrc,
  alt,
  title,
  priority = true,
  className = "",
  wrapperClassName = "",
  overlay,
  placeholderPath = "/placeholders/backdrop.svg",
}: HeroBackdropImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const resolved = resolveHeroBackdropImage({ image, src, fallbackSrc });
  const resolvedAlt = alt ?? getImageAlt({ title, role: "backdrop" });
  const displaySrc = errored ? placeholderPath : resolved.src;
  const displaySrcSet = errored ? undefined : resolved.srcSet;
  const blurSrc = errored ? undefined : resolved.blur;

  // Detect already-cached images: browser fires no onLoad for cached imgs
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [displaySrc]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (!errored) {
      setErrored(true);
      setLoaded(false);
    }
  }, [errored]);

  if (!displaySrc) {
    return (
      <div
        className={`absolute inset-0 size-full overflow-hidden bg-[#05070b] ${wrapperClassName}`}
        role="img"
        aria-label={resolvedAlt}
      />
    );
  }

  return (
    <div className={`absolute inset-0 size-full overflow-hidden ${wrapperClassName}`}>
      {/* Blur layer — sits behind main image, fades out after load */}
      {blurSrc ? (
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          decoding="async"
          loading="eager"
          className={`absolute inset-0 size-full object-cover blur-xl scale-110 transition-opacity duration-700 pointer-events-none ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}

      {/* Main image — fades in on top of blur */}
      <img
        ref={imgRef}
        alt={resolvedAlt}
        decoding="async"
        data-nimg="fill"
        sizes={HERO_IMAGE_SIZES}
        srcSet={displaySrcSet}
        src={displaySrc}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleLoad}
        onError={handleError}
        className={`object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${className}`.trim()}
        style={HERO_IMG_STYLE}
      />

      {overlay}
    </div>
  );
}
