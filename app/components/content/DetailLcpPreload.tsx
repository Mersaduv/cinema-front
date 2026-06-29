import {
  HERO_IMAGE_SIZES,
  resolveHeroBackdropImage,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";

type DetailLcpInput = {
  backdrop_image?: ResponsiveImageAsset | null;
  backdrop_url?: string | null;
  poster_url?: string | null;
};

export default function DetailLcpPreload({ item }: { item: DetailLcpInput }) {
  const resolved = resolveHeroBackdropImage({
    image: item.backdrop_image,
    src: item.backdrop_url,
    fallbackSrc: item.poster_url,
  });

  if (!resolved.src) {
    return null;
  }

  return (
    <link
      rel="preload"
      as="image"
      href={resolved.src}
      imageSrcSet={resolved.srcSet}
      imageSizes={HERO_IMAGE_SIZES}
    />
  );
}
