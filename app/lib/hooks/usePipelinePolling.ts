"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../api";
import { useContentProcessingUpdates } from "./useContentProcessingUpdates";

export type PipelineEntityType = "movie" | "series";

export type PipelineTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface PipelineTask {
  task_key: string;
  task_label: string;
  status: PipelineTaskStatus;
  is_critical: boolean;
  error?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface PipelineState {
  pipeline_id?: number;
  pipeline_status: "idle" | "pending" | "running" | "completed" | "failed";
  progress?: {
    total: number;
    completed: number;
    failed?: number;
    percent: number;
  };
  tasks?: PipelineTask[];
  error_summary?: string | null;
  publish_status?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

function isActivePipelineStatus(status: string | undefined): boolean {
  return status === "pending" || status === "running";
}

export function usePipelinePolling(
  entityType: PipelineEntityType,
  entityId: number | null,
  initialPipelineStatus: string,
  onComplete?: () => void,
  onFailed?: (error: string) => void,
) {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);

  onCompleteRef.current = onComplete;
  onFailedRef.current = onFailed;

  const fetchPipeline = useCallback(async () => {
    if (!entityId) {
      return;
    }

    try {
      const response = await apiClient.get<PipelineState>(
        `/admin/${entityType}s/${entityId}/pipeline`,
      );

      if (!response.success || !response.data) {
        return;
      }

      setPipeline(response.data);

      if (response.data.pipeline_status === "failed") {
        onFailedRef.current?.(response.data.error_summary ?? "خطا در پردازش");
      }
    } catch (error) {
      console.error("Pipeline refresh failed", error);
    }
  }, [entityId, entityType]);

  const { transport } = useContentProcessingUpdates(
    entityType,
    entityId,
    initialPipelineStatus,
    () => {
      void fetchPipeline();
    },
    () => {
      void fetchPipeline().finally(() => {
        onCompleteRef.current?.();
      });
    },
  );

  useEffect(() => {
    if (!entityId || !isActivePipelineStatus(initialPipelineStatus)) {
      return;
    }

    void fetchPipeline();
  }, [entityId, fetchPipeline, initialPipelineStatus, transport]);

  const currentStatus = pipeline?.pipeline_status ?? initialPipelineStatus;

  return {
    pipeline,
    isPolling: isActivePipelineStatus(currentStatus),
    transport,
  };
}
