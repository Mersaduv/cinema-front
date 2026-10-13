import {
  DETAIL_POSTER_SIZES,
  ensureOptimizedImageAsset,
  HERO_IMAGE_SIZES,
  pickImageSrc,
  resolveHeroBackdropImage,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";

type DetailLcpInput = {
  backdrop_image?: ResponsiveImageAsset | null;
  backdrop_url?: string | null;
  poster_image?: ResponsiveImageAsset | null;
  poster_url?: string | null;
};

export default function DetailLcpPreload({ item }: { item: DetailLcpInput }) {
  const hero = resolveHeroBackdropImage({
    image: item.backdrop_image,
    src: item.backdrop_url,
    fallbackSrc: item.poster_url,
  });

  const posterAsset = ensureOptimizedImageAsset(
    item.poster_image,
    item.poster_url,
    "detail-poster",
  );
  const posterSrc = pickImageSrc(posterAsset, item.poster_url);
  const posterSrcSet = posterAsset?.srcset_string?.trim() || undefined;

  return (
    <>
      {/* Blur/LQIP first so the hero never waits on a heavy medium asset. */}
      {hero.blur ? (
        <link rel="preload" as="image" href={hero.blur} fetchPriority="high" />
      ) : null}
      {posterSrc ? (
        <link
          rel="preload"
          as="image"
          href={posterSrc}
          imageSrcSet={posterSrcSet}
          imageSizes={DETAIL_POSTER_SIZES}
        />
      ) : null}
      {hero.src ? (
        <link
          rel="preload"
          as="image"
          href={hero.src}
          imageSrcSet={hero.srcSet}
          imageSizes={HERO_IMAGE_SIZES}
          fetchPriority="low"
        />
      ) : null}
    </>
  );
}
