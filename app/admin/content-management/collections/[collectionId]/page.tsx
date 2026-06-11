"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import CollectionEditorForm from "../_components/CollectionEditorForm";

export default function EditCollectionPage() {
  const params = useParams<{ collectionId: string }>();

  return (
    <Suspense
      fallback={
        <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
      }
    >
      <CollectionEditorForm mode="edit" collectionId={Number(params.collectionId)} />
    </Suspense>
  );
}
