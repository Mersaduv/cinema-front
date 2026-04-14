"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlinePlay, HiOutlineVideoCamera } from "react-icons/hi";
import { moviesService, type PublicMovie } from "../../lib/movies";

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return "نامشخص";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} دقیقه`;
  }

  return `${hours} ساعت و ${minutes} دقیقه`;
}

export default function PublicMoviePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [movie, setMovie] = useState<PublicMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMovie = async () => {
      setLoading(true);
      setError("");

      const response = await moviesService.show(slug);

      if (response.success && response.data) {
        setMovie(response.data.movie);
      } else {
        setError(response.message || "دریافت اطلاعات فیلم انجام نشد.");
      }

      setLoading(false);
    };

    if (slug) {
      void loadMovie();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="h-96 animate-pulse rounded-[36px] border border-white/10 bg-white/[0.03]" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="rounded-[32px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-[#fecdd3]">
          {error || "فیلم پیدا نشد."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.14),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
              <HiOutlineVideoCamera className="h-4 w-4" />
              Cinema Streaming
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              {movie.title}
            </h1>
            <p className="mt-3 text-sm text-[#8ea4b3]">/{movie.slug}</p>
            <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
              {movie.synopsis || "برای این فیلم هنوز خلاصه‌ای ثبت نشده است."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#d6e3ea]">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                سال انتشار: {movie.release_year || "نامشخص"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                مدت زمان: {formatDuration(movie.duration_seconds)}
              </span>
              {movie.has_dubbed_audio ? (
                <span className="rounded-full border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-4 py-2 text-[#7dd3fc]">
                  دوبله
                </span>
              ) : null}
              {movie.has_subtitle ? (
                <span className="rounded-full border border-[#f5c518]/20 bg-[#f5c518]/10 px-4 py-2 text-[#f8d977]">
                  زیرنویس
                </span>
              ) : null}
            </div>

            {movie.playback?.master_playlist_url ? (
              <div className="mt-8">
                <Link
                  href={`/watch/${movie.slug}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
                >
                  <HiOutlinePlay className="h-5 w-5" />
                  پخش فیلم
                </Link>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#d6e3ea]">
                خروجی HLS این فیلم هنوز آماده نشده است.
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#09141c] p-6">
            <h2 className="text-xl font-bold text-white">کیفیت‌های آماده</h2>
            <div className="mt-5 space-y-3">
              {movie.playback?.variants.length ? (
                movie.playback.variants.map((variant) => (
                  <div
                    key={variant.profile_key}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">
                        {variant.profile_key}
                      </span>
                      <span className="text-[#8ea4b3]">{variant.resolution}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#8ea4b3]">
                      bandwidth: {variant.bandwidth.toLocaleString("en-US")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-5 text-sm text-[#8ea4b3]">
                  هنوز کیفیتی برای این فیلم تولید نشده است.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
