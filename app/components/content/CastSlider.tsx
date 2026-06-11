"use client";

import Link from "next/link";
import ContentListSlider from "../catalog/ContentListSlider";
import { PersonProfileImage } from "../images";
import type { ResponsiveImageAsset } from "../../lib/cinema-image";

export type CastSliderRow = {
  name: string | null;
  character: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
  slug?: string | null;
};

const CAST_SLIDE_CLASS =
  "shrink-0 snap-start w-[120px] min-w-[120px] sm:w-[132px] sm:min-w-[132px] md:w-[148px] md:min-w-[148px]";

function formatCharacterLabel(character: string | null): string {
  const trimmed = character?.trim();

  if (!trimmed) {
    return "نقش ثبت نشده";
  }

  return `در نقش ${trimmed}`;
}

export default function CastSlider({
  title = "بازیگران",
  cast,
}: {
  title?: string;
  cast: CastSliderRow[];
}) {
  if (cast.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5" aria-labelledby="cast-slider-heading">
      <h2
        id="cast-slider-heading"
        className="text-right text-xl font-bold text-white md:text-2xl"
      >
        {title}
      </h2>

      <ContentListSlider ariaLabel={title} step={4}>
        {cast.map((actor, index) => {
          const profile = (
            <div className="flex flex-col items-center text-center">
              <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full bg-white/10 sm:h-[96px] sm:w-[96px] md:h-[104px] md:w-[104px]">
                <PersonProfileImage
                  name={actor.name || title}
                  image={actor.profile_image}
                  src={actor.profile_url}
                  square
                  sizes="104px"
                  loading={index < 8 ? "eager" : "lazy"}
                  draggable={false}
                />
              </div>
              <p className="mt-3 w-full whitespace-normal break-words text-sm font-semibold leading-6 text-white sm:text-[15px] sm:leading-7">
                {actor.name || "بازیگر"}
              </p>
              <p className="mt-1 w-full whitespace-normal break-words text-xs leading-6 text-white/55 sm:text-sm sm:leading-7">
                {formatCharacterLabel(actor.character)}
              </p>
            </div>
          );

          return (
            <div
              key={`${actor.slug || actor.name || "actor"}-${index}`}
              data-slider-slide
              className={CAST_SLIDE_CLASS}
            >
              {actor.slug ? (
                <Link
                  href={`/actors/${actor.slug}`}
                  draggable={false}
                  className="block text-inherit no-underline transition-opacity hover:opacity-90"
                >
                  {profile}
                </Link>
              ) : (
                profile
              )}
            </div>
          );
        })}
      </ContentListSlider>
    </section>
  );
}
