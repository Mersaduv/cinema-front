import { notFound } from "next/navigation";
import { graphqlMovieToPublic } from "../../lib/graphql/adapters";
import { graphqlRequest } from "../../lib/graphql/server";
import { GET_MOVIE } from "../../lib/graphql/queries";
import MovieDetailClient from "./MovieDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const data = await graphqlRequest<{ movie: Parameters<typeof graphqlMovieToPublic>[0] | null }>(
      GET_MOVIE,
      { slug },
      { revalidate: 60, tags: ["movies", `movie:${slug}`] },
    );
    const movie = data.movie;

    if (!movie) {
      return {};
    }

    return {
      title: movie.title,
      description: movie.synopsis?.slice(0, 160),
      openGraph: {
        images: movie.poster_url ? [movie.poster_url] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function PublicMoviePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const data = await graphqlRequest<{ movie: Parameters<typeof graphqlMovieToPublic>[0] | null }>(
      GET_MOVIE,
      { slug },
      { revalidate: 60, tags: ["movies", `movie:${slug}`] },
    );

    if (!data.movie) {
      notFound();
    }

    return <MovieDetailClient movie={graphqlMovieToPublic(data.movie)} />;
  } catch {
    notFound();
  }
}
