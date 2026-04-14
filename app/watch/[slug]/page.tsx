"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import HlsVideoPlayer from "../../components/player/HlsVideoPlayer";
import { moviesService, type PublicMovie } from "../../lib/movies";

export default function WatchMoviePage() {
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
        setError(response.message || "دریافت اطلاعات پخش انجام نشد.");
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

  if (!movie?.playback?.master_playlist_url) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="rounded-[32px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-[#fecdd3]">
          {error || "خروجی HLS برای این فیلم آماده نیست."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <section className="space-y-6 overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,16,24,0.96),rgba(12,26,36,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {movie.title}
            </h1>
            <p className="mt-2 text-sm text-[#8ea4b3]">
              پخش تطبیقی HLS بر اساس master.m3u8
            </p>
          </div>
          <Link
            href={`/movies/${movie.slug}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            بازگشت به صفحه فیلم
            <HiOutlineArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <HlsVideoPlayer
          src={movie.playback.master_playlist_url}
          poster={movie.poster_url}
        />
      </section>
    </div>
  );
}
