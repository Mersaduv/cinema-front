"use client";

import { getImageAlt } from "../../lib/cinema-image";
import ResponsiveImage, { type ResponsiveImageProps } from "./ResponsiveImage";

type GenreArtworkImageProps = Omit<
  ResponsiveImageProps,
  "usage" | "objectFit" | "alt"
> & {
  genreName?: string | null;
  alt?: string;
};

export default function GenreArtworkImage({
  genreName,
  alt,
  placeholderPath = "/placeholders/genre.svg",
  image,
  src,
  fallbackUrl,
  objectFit = "contain",
  ...rest
}: GenreArtworkImageProps) {
  return (
    <ResponsiveImage
      image={image}
      src={src}
      fallbackUrl={fallbackUrl}
      alt={alt ?? getImageAlt({ title: genreName, role: "genre" })}
      usage="genre-icon"
      objectFit={objectFit}
      placeholderPath={placeholderPath}
      fill
      {...rest}
    />
  );
}
