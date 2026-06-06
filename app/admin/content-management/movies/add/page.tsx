"use client";

import { Suspense } from "react";
import MovieEditorForm from "../_components/MovieEditorForm";

export default function AddMoviePage() {
  return (
    <Suspense
      fallback={
        <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />
      }
    >
      <MovieEditorForm mode="create" />
    </Suspense>
  );
}
