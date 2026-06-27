import type { CarouselConfig, CarouselTier } from "../../types/carousel";

type CarouselTierDefinition = Omit<CarouselConfig, "tier" | "maxItems"> & {
  totalPool: number;
};

export const CAROUSEL_CONFIG: Record<CarouselTier, CarouselTierDefinition> = {
  small: {
    totalPool: 10,
    initialFetch: 6,
    batchSize: 4,
    sentinelAtIndex: 4,
    skeletonCount: 3,
  },
  medium: {
    totalPool: 15,
    initialFetch: 6,
    batchSize: 6,
    sentinelAtIndex: 4,
    skeletonCount: 3,
  },
  large: {
    totalPool: 20,
    initialFetch: 6,
    batchSize: 6,
    sentinelAtIndex: 4,
    skeletonCount: 3,
  },
};

export const HOME_RAIL_CAROUSEL_PER_PAGE = 6;

export function getCarouselTier(total: number): CarouselTier {
  if (total <= 10) {
    return "small";
  }

  if (total <= 15) {
    return "medium";
  }

  return "large";
}

export function getCarouselConfig(total: number): CarouselConfig {
  const tier = getCarouselTier(total);
  const definition = CAROUSEL_CONFIG[tier];

  return {
    tier,
    initialFetch: definition.initialFetch,
    batchSize: definition.batchSize,
    sentinelAtIndex: definition.sentinelAtIndex,
    maxItems: Math.min(definition.totalPool, total),
    skeletonCount: definition.skeletonCount,
  };
}

export function formatPersianCount(value: number): string {
  return value.toLocaleString("fa-IR");
}
