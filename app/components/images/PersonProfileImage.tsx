"use client";

import {
  getImageAlt,
  isManagedImageUrl,
  pickProfileImageSrc,
  pickProfileSrcSet,
} from "../../lib/cinema-image";
import ResponsiveImage, { type ResponsiveImageProps } from "./ResponsiveImage";

type PersonProfileImageProps = Omit<
  ResponsiveImageProps,
  "usage" | "objectFit" | "alt"
> & {
  name?: string | null;
  alt?: string;
  square?: boolean;
};

export default function PersonProfileImage({
  name,
  alt,
  square = false,
  placeholderPath = "/placeholders/person.svg",
  image,
  src,
  fallbackUrl,
  aspectRatio,
  ...rest
}: PersonProfileImageProps) {
  const resolvedSrc = pickProfileImageSrc(image, src ?? fallbackUrl);
  const resolvedSrcSet = pickProfileSrcSet(image);
  const safeImage =
    resolvedSrc || resolvedSrcSet
      ? {
          ...image,
          src: resolvedSrc ?? image?.src,
          srcset_string: resolvedSrcSet ?? image?.srcset_string,
        }
      : null;

  return (
    <ResponsiveImage
      image={safeImage}
      src={resolvedSrc}
      fallbackUrl={
        fallbackUrl && isManagedImageUrl(fallbackUrl) ? fallbackUrl : undefined
      }
      alt={alt ?? getImageAlt({ name, role: "profile" })}
      usage="person-card"
      aspectRatio={aspectRatio ?? (square ? "1 / 1" : "2 / 3")}
      objectFit="cover"
      placeholderPath={placeholderPath}
      fill
      {...rest}
    />
  );
}
