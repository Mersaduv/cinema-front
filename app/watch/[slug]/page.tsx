"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
      <div className="h-screen w-screen bg-black">
        <div className="h-full w-full animate-pulse bg-white/[0.03]" />
      </div>
    );
  }

  if (!movie?.playback?.master_playlist_url) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black p-6">
        <div className="max-w-2xl rounded-[32px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-[#fecdd3]">
          {error || "خروجی HLS برای این فیلم آماده نیست."}
        </div>
      </div>
    );
  }

  return (
    <HlsVideoPlayer
      src={movie.playback.master_playlist_url}
      poster={movie.poster_url}
      title={movie.title}
      backHref={`/movies/${movie.slug}`}
      immersive
      availableVariants={movie.playback.variants}
      availableAudioTracks={movie.playback.audio_tracks || []}
    />
  );
}
