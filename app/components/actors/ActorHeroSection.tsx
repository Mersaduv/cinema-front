"use client";

import { useState } from "react";
import {
  normalizeImageAsset,
  pickProfileFromItem,
  type ResponsiveImageAsset,
} from "../../lib/cinema-image";
import { BackdropImage, PersonProfileImage } from "../images";

export default function ActorHeroSection({
  name,
  biography,
  profileUrl,
  profileImage,
}: {
  name: string;
  biography: string | null;
  profileUrl: string | null;
  profileImage?: ResponsiveImageAsset | null;
}) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const bioText = biography?.trim() || "اطلاعاتی برای این بازیگر ثبت نشده است.";
  const canExpand = bioText.length > 180;
  const normalizedProfileImage = normalizeImageAsset(profileImage);
  const profile = pickProfileFromItem({
    profile_url: profileUrl,
    profile_image: normalizedProfileImage,
  });

  return (
    <section className="relative overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        {profile.src ? (
          <>
            <div className="absolute inset-0 opacity-70 blur-[48px]">
              <BackdropImage
                title={name}
                image={normalizedProfileImage}
                src={profile.src}
                usage="hero-backdrop"
                loading="eager"
                wrapperClassName="scale-110 object-[center_20%]"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.55)_45%,#000000_88%)]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#121820_0%,#000000_100%)]" />
        )}
      </div>

      <div className="relative mx-auto max-w-[1820px] px-4 pb-10 pt-28 md:px-7 md:pb-14 md:pt-32">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10 lg:gap-14">
          <div className="mx-auto w-full max-w-[280px] shrink-0 md:mx-0 md:max-w-[320px] lg:max-w-[360px]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <PersonProfileImage
                name={name}
                image={normalizedProfileImage}
                src={profile.src}
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 320px, 280px"
                loading="eager"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 text-right">
            <h1 className="text-3xl font-black leading-tight text-white md:text-4xl lg:text-[2.75rem]">
              {name}
            </h1>

            <div className="mt-5 max-w-3xl">
              <p
                className={`text-sm leading-8 text-white/72 md:text-[15px] md:leading-8 ${
                  bioExpanded ? "" : "line-clamp-4"
                }`}
              >
                {bioText}
              </p>

              {canExpand ? (
                <button
                  type="button"
                  onClick={() => setBioExpanded((current) => !current)}
                  className="mt-3 text-sm font-semibold text-white/55 transition hover:text-white/80"
                >
                  {bioExpanded ? "کمتر" : "بیشتر بخوانید"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
