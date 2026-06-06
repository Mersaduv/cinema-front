import Image from "next/image";
import Link from "next/link";

export interface MovieCardData {
  slug: string;
  title: string;
  release_year?: number | null;
  poster_url?: string | null;
  has_dubbed_audio?: boolean;
}

export default function MovieCard({ movie }: { movie: MovieCardData }) {
  return (
    <Link href={`/movies/${movie.slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
        {movie.poster_url ? (
          <Image
            src={movie.poster_url}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800 px-2">
            <span className="text-center text-xs text-gray-500">{movie.title}</span>
          </div>
        )}
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
