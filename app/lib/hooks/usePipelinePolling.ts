"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../api";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

      const data = response.data;
      setPipeline(data);

      if (data.pipeline_status === "completed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete?.();
      } else if (data.pipeline_status === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onFailed?.(data.error_summary ?? "خطا در پردازش");
      }
    } catch (error) {
      console.error("Pipeline poll failed", error);
    }
  }, [entityId, entityType, onComplete, onFailed]);

  useEffect(() => {
    if (!entityId || !isActivePipelineStatus(initialPipelineStatus)) {
      return;
    }

    void fetchPipeline();
    intervalRef.current = setInterval(() => {
      void fetchPipeline();
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [entityId, fetchPipeline, initialPipelineStatus]);

  const currentStatus = pipeline?.pipeline_status ?? initialPipelineStatus;

  return {
    pipeline,
    isPolling: isActivePipelineStatus(currentStatus),
  };
}
