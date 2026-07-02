"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SeriesEditorForm from "../_components/SeriesEditorForm";
import { adminCreateSeriesHref } from "../../../../lib/admin-create-links";

function CreateSeriesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/4" />
      <div className="h-[34rem] animate-pulse rounded-[32px] border border-white/10 bg-white/4" />
    </div>
  );
}

function AddSeriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fresh = searchParams.get("fresh");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);

    if (!fresh) {
      router.replace(adminCreateSeriesHref());
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setReady(true);
    });

    const handlePageShow = (event: PageTransitionEvent) => {
      const navigationEntry = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const restoredFromHistory =
        event.persisted || navigationEntry?.type === "back_forward";

      if (restoredFromHistory) {
        router.replace(adminCreateSeriesHref());
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [fresh, router]);

  if (!fresh || !ready) {
    return <CreateSeriesSkeleton />;
  }

  return (
    <SeriesEditorForm key={fresh} mode="create" createInstanceKey={fresh} />
  );
}

export default function AddSeriesPage() {
  return (
    <Suspense
      fallback={<CreateSeriesSkeleton />}
    >
      <AddSeriesPageContent />
    </Suspense>
  );
}
