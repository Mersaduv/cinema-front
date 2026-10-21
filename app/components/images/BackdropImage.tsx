"use client";

import { getImageAlt, type ResponsiveImageAsset } from "../../lib/cinema-image";
import HeroBackdropImage from "./HeroBackdropImage";
import ResponsiveImage, { type ResponsiveImageProps } from "./ResponsiveImage";

type BackdropImageProps = Omit<
  ResponsiveImageProps,
  "usage" | "aspectRatio" | "objectFit" | "alt"
> & {
  title?: string | null;
  alt?: string;
  usage?: "hero-backdrop" | "detail-backdrop";
  placeholderPath?: string;
  allowRemoteFallback?: boolean;
  deferLoad?: boolean;
  onLoadComplete?: () => void;
};

export default function BackdropImage({
  title,
  alt,
  usage = "detail-backdrop",
  placeholderPath = "/placeholders/backdrop.svg",
  loading = usage === "hero-backdrop" ? "eager" : "lazy",
  image,
  src,
  fallbackUrl,
  allowRemoteFallback = false,
  deferLoad = false,
  onLoadComplete,
  ...rest
}: BackdropImageProps) {
  if (usage === "hero-backdrop") {
    return (
      <HeroBackdropImage
        image={image}
        src={src}
        fallbackSrc={fallbackUrl}
        title={title}
        alt={alt}
        priority={loading === "eager"}
        fetchPriority={loading === "eager" ? "high" : "auto"}
        placeholderPath={placeholderPath}
        deferLoad={deferLoad}
        onLoadComplete={onLoadComplete}
        {...rest}
      />
    );
  }

  return (
    <ResponsiveImage
      image={image}
      src={src}
      fallbackUrl={fallbackUrl}
      alt={alt ?? getImageAlt({ title, role: "backdrop" })}
      usage={usage}
      aspectRatio="16 / 9"
      objectFit="cover"
      loading={loading}
      placeholderPath={placeholderPath}
      allowRemoteFallback={allowRemoteFallback}
      deferLoad={deferLoad}
      onLoadComplete={onLoadComplete}
      fill
      {...rest}
    />
  );
}

export type { ResponsiveImageAsset };
