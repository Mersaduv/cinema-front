"use client";

import { Suspense } from "react";
import SeriesEditorForm from "../_components/SeriesEditorForm";

export default function AddSeriesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
      }
    >
      <SeriesEditorForm mode="create" />
    </Suspense>
  );
}
