"use client";

import { getImageAlt } from "../../lib/cinema-image";
import ResponsiveImage, { type ResponsiveImageProps } from "./ResponsiveImage";

type EpisodeStillImageProps = Omit<
  ResponsiveImageProps,
  "usage" | "aspectRatio" | "objectFit" | "alt"
> & {
  seriesTitle?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  alt?: string;
  usage?: "episode-card" | "episode-detail";
};

export default function EpisodeStillImage({
  seriesTitle,
  seasonNumber,
  episodeNumber,
  alt,
  usage = "episode-card",
  placeholderPath = "/placeholders/episode.svg",
  image,
  src,
  fallbackUrl,
  ...rest
}: EpisodeStillImageProps) {
  return (
    <ResponsiveImage
      image={image}
      src={src}
      fallbackUrl={fallbackUrl}
      alt={
        alt ??
        getImageAlt({
          title: seriesTitle,
          seasonNumber,
          episodeNumber,
          role: "still",
        })
      }
      usage={usage}
      aspectRatio="16 / 9"
      objectFit="cover"
      placeholderPath={placeholderPath}
      fill
      {...rest}
    />
  );
}
