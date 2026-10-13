import {
  HERO_IMAGE_SIZES,
  resolveHeroBackdropImage,
} from "../../lib/cinema-image";
import type { FeaturedCatalogItem } from "../../lib/catalog/home";

export default function HeroLcpPreload({
  item,
}: {
  item: FeaturedCatalogItem | undefined;
}) {
  if (!item) {
    return null;
  }

  const resolved = resolveHeroBackdropImage({
    image: item.backdrop_image,
    src: item.backdrop_url ?? item.details.backdrop_url ?? null,
    fallbackSrc: item.poster_url,
  });

  if (!resolved.src && !resolved.blur) {
    return null;
  }

  return (
    <>
      {resolved.blur ? (
        <link rel="preload" as="image" href={resolved.blur} fetchPriority="high" />
      ) : null}
      {resolved.src ? (
        <link
          rel="preload"
          as="image"
          href={resolved.src}
          imageSrcSet={resolved.srcSet}
          imageSizes={HERO_IMAGE_SIZES}
          fetchPriority="high"
        />
      ) : null}
    </>
  );
}
