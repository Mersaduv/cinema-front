"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import SeriesEditorForm from "../_components/SeriesEditorForm";

export default function EditSeriesPage() {
  const params = useParams<{ seriesId: string }>();

  return (
    <Suspense
      fallback={
        <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
      }
    >
      <SeriesEditorForm mode="edit" seriesId={params.seriesId} />
    </Suspense>
  );
}
