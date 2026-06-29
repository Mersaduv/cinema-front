import { notFound } from "next/navigation";
import { graphqlMovieToPublic } from "../../lib/graphql/adapters";
import { graphqlRequest } from "../../lib/graphql/server";
import { GET_MOVIE_PREVIEW } from "../../lib/graphql/queries";
import {
  fetchMovieCriticalBySlug,
  fetchMovieMetaBySlug,
} from "../../lib/detail/detail-fetch";
import DetailLcpPreload from "../../components/content/DetailLcpPreload";
import MovieDetailClient from "./MovieDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const movie = await fetchMovieMetaBySlug(slug);

    if (!movie) {
      return {};
    }

    return {
      title: movie.meta_title?.trim() || movie.title,
      description:
        movie.meta_description?.trim() || movie.synopsis?.slice(0, 160) || undefined,
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;

  try {
    if (preview) {
      const data = await graphqlRequest<{
        moviePreview: Parameters<typeof graphqlMovieToPublic>[0] | null;
      }>(GET_MOVIE_PREVIEW, { slug, token: preview }, { cache: "no-store" });

      if (!data.moviePreview) {
        notFound();
      }

      const movie = graphqlMovieToPublic(data.moviePreview);

      return (
        <>
          <DetailLcpPreload item={movie} />
          <MovieDetailClient movie={movie} previewMode />
        </>
      );
    }

    const movie = await fetchMovieCriticalBySlug(slug);

    if (!movie) {
      notFound();
    }

    return (
      <>
        <DetailLcpPreload item={movie} />
        <MovieDetailClient movie={movie} />
      </>
    );
  } catch (error) {
    console.error("[PublicMoviePage]", slug, error);
    throw error;
  }
}
