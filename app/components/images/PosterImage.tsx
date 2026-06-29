"use client";

import { getImageAlt, type ResponsiveImageAsset } from "../../lib/cinema-image";
import ResponsiveImage, { type ResponsiveImageProps } from "./ResponsiveImage";

type PosterImageProps = Omit<
  ResponsiveImageProps,
  "usage" | "aspectRatio" | "objectFit" | "alt"
> & {
  title?: string | null;
  alt?: string;
  usage?: "poster-grid" | "poster-card" | "detail-poster";
  placeholderPath?: string;
};

export default function PosterImage({
  title,
  alt,
  usage = "poster-card",
  placeholderPath = "/placeholders/poster.svg",
  loading,
  fetchPriority,
  image,
  src,
  fallbackUrl,
  ...rest
}: PosterImageProps) {
  const resolvedLoading =
    loading ?? (usage === "detail-poster" ? "eager" : "lazy");

  return (
    <ResponsiveImage
      image={image}
      src={src}
      fallbackUrl={fallbackUrl}
      alt={alt ?? getImageAlt({ title, role: "poster" })}
      usage={usage}
      aspectRatio="2 / 3"
      objectFit="cover"
      loading={resolvedLoading}
      fetchPriority={fetchPriority}
      placeholderPath={placeholderPath}
      fill
      {...rest}
    />
  );
}

export type { ResponsiveImageAsset };
