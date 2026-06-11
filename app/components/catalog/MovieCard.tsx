import Link from "next/link";
import { PosterImage } from "../images";
import type { ResponsiveImageAsset } from "../../lib/cinema-image";

export interface MovieCardData {
  slug: string;
  title: string;
  release_year?: number | null;
  poster_url?: string | null;
  poster_image?: ResponsiveImageAsset | null;
  has_dubbed_audio?: boolean;
}

export default function MovieCard({ movie }: { movie: MovieCardData }) {
  return (
    <Link href={`/movies/${movie.slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
        <PosterImage
          title={movie.title}
          image={movie.poster_image}
          src={movie.poster_url}
          usage="poster-card"
          wrapperClassName="transition-transform duration-300 group-hover:scale-105"
        />
        {movie.has_dubbed_audio ? (
          <span className="absolute top-1 right-1 rounded bg-blue-600 px-1 text-xs text-white">
            دوبله
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="truncate text-xs font-medium text-white">{movie.title}</p>
          {movie.release_year ? (
            <p className="text-xs text-gray-400">{movie.release_year}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
