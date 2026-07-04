"use client";

import { useEffect } from "react";
import {
  subscribeContentProcessingUpdates,
  type ContentProcessingEntityType,
  type ContentProcessingUpdate,
} from "../broadcast/content-processing";

export function useAdminListProcessingFeed(
  entityType: ContentProcessingEntityType,
  entityIds: number[],
  onUpdate: (update: ContentProcessingUpdate) => void,
): void {
  useEffect(() => {
    const uniqueIds = Array.from(new Set(entityIds.filter((id) => id > 0)));

    if (uniqueIds.length === 0) {
      return;
    }

    const unsubscribers = uniqueIds.map((entityId) =>
      subscribeContentProcessingUpdates(entityType, entityId, onUpdate),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [entityType, entityIds, onUpdate]);
}
