"use client";

import { getImageAlt } from "../../lib/cinema-image";
import ResponsiveImage, { type ResponsiveImageProps } from "./ResponsiveImage";

type CollectionImageProps = Omit<
  ResponsiveImageProps,
  "usage" | "aspectRatio" | "objectFit" | "alt"
> & {
  title?: string | null;
  alt?: string;
  variant?: "poster" | "backdrop";
};

export default function CollectionImage({
  title,
  alt,
  variant = "poster",
  placeholderPath = "/placeholders/collection.svg",
  image,
  src,
  fallbackUrl,
  ...rest
}: CollectionImageProps) {
  return (
    <ResponsiveImage
      image={image}
      src={src}
      fallbackUrl={fallbackUrl}
      alt={alt ?? getImageAlt({ title, role: "poster" })}
      usage="collection-card"
      aspectRatio={variant === "backdrop" ? "16 / 9" : "2 / 3"}
      objectFit="cover"
      placeholderPath={placeholderPath}
      fill
      {...rest}
    />
  );
}
