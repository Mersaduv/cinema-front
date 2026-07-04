"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "../api";
import {
  isContentProcessingBroadcastAvailable,
  subscribeContentProcessingUpdates,
  type ContentProcessingEntityType,
  type ContentProcessingUpdate,
} from "../broadcast/content-processing";
import type { PipelineState } from "./usePipelinePolling";

const POLL_INTERVAL_MS = 2_000;
const FALLBACK_POLL_INTERVAL_MS = 800;
const FALLBACK_MAX_WAIT_MS = 15_000;

function isActivePipelineStatus(status: string | undefined): boolean {
  return status === "pending" || status === "running";
}

function isProcessingSettled(update: ContentProcessingUpdate): boolean {
  const pipelineDone = !isActivePipelineStatus(update.pipeline_status ?? undefined);
  const hlsReady =
    update.processing_status === "ready" || update.processing_status === "failed";

  return pipelineDone && hlsReady && update.image_status !== "processing";
}

export function useContentProcessingUpdates(
  entityType: ContentProcessingEntityType,
  entityId: number | null,
  initialPipelineStatus: string,
  onUpdate?: (update: ContentProcessingUpdate) => void,
  onSettled?: () => void,
) {
  const [lastUpdate, setLastUpdate] = useState<ContentProcessingUpdate | null>(null);
  const [transport, setTransport] = useState<"websocket" | "polling" | "idle">("idle");
  const onUpdateRef = useRef(onUpdate);
  const onSettledRef = useRef(onSettled);

  onUpdateRef.current = onUpdate;
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (!entityId || !isActivePipelineStatus(initialPipelineStatus)) {
      setTransport("idle");
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let settled = false;

    const applyUpdate = (update: ContentProcessingUpdate) => {
      if (cancelled || settled) {
        return;
      }

      setLastUpdate(update);
      onUpdateRef.current?.(update);

      if (isProcessingSettled(update)) {
        settled = true;
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        onSettledRef.current?.();
      }
    };

    const startPolling = (intervalMs: number) => {
      if (pollTimer) {
        return;
      }

      setTransport("polling");

      const poll = async () => {
        const response = await apiClient.get<PipelineState>(
          `/admin/${entityType}s/${entityId}/pipeline`,
        );

        if (!response.success || !response.data || cancelled) {
          return;
        }

        applyUpdate({
          entity_type: entityType,
          entity_id: entityId,
          processing_status: "queued",
          pipeline_status: response.data.pipeline_status,
        });
      };

      void poll();
      pollTimer = setInterval(() => {
        void poll();
      }, intervalMs);
    };

    if (isContentProcessingBroadcastAvailable()) {
      setTransport("websocket");

      const unsubscribe = subscribeContentProcessingUpdates(
        entityType,
        entityId,
        applyUpdate,
      );

      const fallbackTimer = window.setTimeout(() => {
        if (!settled && !pollTimer) {
          startPolling(POLL_INTERVAL_MS);
        }
      }, 3_000);

      return () => {
        cancelled = true;
        window.clearTimeout(fallbackTimer);
        unsubscribe();
        if (pollTimer) {
          clearInterval(pollTimer);
        }
      };
    }

    startPolling(POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [entityId, entityType, initialPipelineStatus]);

  return { lastUpdate, transport };
}

export async function waitForContentProcessingSettled(
  entityType: ContentProcessingEntityType,
  entityId: number,
  options?: { intervalMs?: number; maxWait?: number },
): Promise<ContentProcessingUpdate | null> {
  const intervalMs = options?.intervalMs ?? FALLBACK_POLL_INTERVAL_MS;
  const maxWait = options?.maxWait ?? FALLBACK_MAX_WAIT_MS;
  const startedAt = Date.now();

  return new Promise((resolve) => {
    let resolved = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let unsubscribe: () => void = () => {};

    const finish = (update: ContentProcessingUpdate | null) => {
      if (resolved) {
        return;
      }

      resolved = true;
      unsubscribe();
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      resolve(update);
    };

    const handleUpdate = (update: ContentProcessingUpdate) => {
      if (isProcessingSettled(update)) {
        finish(update);
      }
    };

    if (isContentProcessingBroadcastAvailable()) {
      unsubscribe = subscribeContentProcessingUpdates(entityType, entityId, handleUpdate);
    }

    const poll = async () => {
      const response = await apiClient.get<{ movie?: { processing_status?: string }; series?: { processing_status?: string } }>(
        `/admin/${entityType}s/${entityId}`,
      );

      if (!response.success) {
        return;
      }

      const processingStatus =
        entityType === "movie"
          ? response.data?.movie?.processing_status
          : response.data?.series?.processing_status;

      if (processingStatus === "ready" || processingStatus === "failed") {
        finish({
          entity_type: entityType,
          entity_id: entityId,
          processing_status: processingStatus,
        });
      }
    };

    void poll();
    pollTimer = setInterval(() => {
      if (Date.now() - startedAt >= maxWait) {
        finish(null);
        return;
      }

      void poll();
    }, intervalMs);
  });
}
