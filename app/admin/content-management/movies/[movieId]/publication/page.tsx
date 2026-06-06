"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import MovieEditorForm from "../../_components/MovieEditorForm";

export default function MoviePublicationPage() {
  const params = useParams<{ movieId: string }>();

  return (
    <Suspense
      fallback={
        <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />
      }
    >
      <MovieEditorForm mode="edit" movieId={params.movieId} />
    </Suspense>
  );
}
