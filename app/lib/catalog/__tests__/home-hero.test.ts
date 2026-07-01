import { describe, expect, it } from "vitest";
import { pickFeaturedHeroSlides } from "../home";
import type { CatalogListItem } from "../rest";

function heroItem(
  overrides: Partial<CatalogListItem> & Pick<CatalogListItem, "id" | "slug" | "title">,
): CatalogListItem {
  return {
    synopsis: null,
    release_year: 2024,
    poster_url: "/poster.jpg",
    backdrop_url: "/backdrop.jpg",
    has_subtitle: false,
    has_dubbed: false,
    details: { genres: [], rating: 8 },
    is_featured: false,
    exclude_from_slider: false,
    catalog_visibility: "catalog_search",
    ...overrides,
  };
}

describe("pickFeaturedHeroSlides", () => {
  it("does not show admin-unchecked items via the algorithm pool", () => {
    const hybridMovie = heroItem({
      id: 1,
      slug: "sinners",
      title: "Sinners",
      rating: 7.5,
      is_featured: false,
      exclude_from_slider: true,
    });

    const slides = pickFeaturedHeroSlides([], [], [hybridMovie], [], [], []);

    expect(slides).toHaveLength(0);
  });

  it("shows editorial featured items with backdrop", () => {
    const featuredMovie = heroItem({
      id: 2,
      slug: "featured-movie",
      title: "Featured",
      is_featured: true,
      exclude_from_slider: false,
    });

    const slides = pickFeaturedHeroSlides(
      [],
      [],
      [],
      [],
      [featuredMovie],
      [],
    );

    expect(slides).toHaveLength(1);
    expect(slides[0]?.slug).toBe("featured-movie");
  });
});
