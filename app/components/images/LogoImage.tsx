"use client";

import { getImageAlt } from "../../lib/cinema-image";
import ResponsiveImage, { type ResponsiveImageProps } from "./ResponsiveImage";

type LogoImageProps = Omit<
  ResponsiveImageProps,
  "usage" | "objectFit" | "alt" | "aspectRatio"
> & {
  title?: string | null;
  alt?: string;
};

export default function LogoImage({
  title,
  alt,
  image,
  src,
  fallbackUrl,
  ...rest
}: LogoImageProps) {
  return (
    <ResponsiveImage
      image={image}
      src={src}
      fallbackUrl={fallbackUrl}
      alt={alt ?? getImageAlt({ title, role: "logo" })}
      usage="logo"
      objectFit="contain"
      fill
      {...rest}
    />
  );
}
