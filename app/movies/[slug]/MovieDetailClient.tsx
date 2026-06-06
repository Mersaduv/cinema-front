"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ContentDetailPage from "../../components/content/ContentDetailPage";
import { moviesService, type PublicMovie, type PublicMovieListItem } from "../../lib/movies";

export default function MovieDetailClient({
  movie: initialMovie,
}: {
  movie: PublicMovie;
}) {
  const [movie] = useState(initialMovie);
  const [similarMovies, setSimilarMovies] = useState<PublicMovieListItem[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const similarRequestedRef = useRef(false);

  const loadSimilar = useCallback(async () => {
    if (similarRequestedRef.current) {
      return;
    }

    similarRequestedRef.current = true;
    setLoadingSimilar(true);

    try {
      const response = await moviesService.related(movie.slug, 8);
      if (response.success && response.data?.movies) {
        setSimilarMovies(response.data.movies);
      }
    } finally {
      setLoadingSimilar(false);
    }
  }, [movie.slug]);

  useEffect(() => {
    void loadSimilar();
  }, [loadSimilar]);

  return (
    <ContentDetailPage
      kind="movie"
      movie={movie}
      similarLoading={loadingSimilar}
      onRequestSimilar={() => {
        void loadSimilar();
      }}
      similarItems={similarMovies.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        synopsis: item.synopsis,
        poster_url: item.poster_url,
        backdrop_url: item.details.backdrop_url,
        release_year: item.release_year,
        details: item.details,
      }))}
    />
  );
}
