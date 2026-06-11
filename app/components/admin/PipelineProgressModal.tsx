"use client";

import {
  usePipelinePolling,
  type PipelineEntityType,
  type PipelineTaskStatus,
} from "../../lib/hooks/usePipelinePolling";

interface PipelineProgressModalProps {
  entityType: PipelineEntityType;
  entityId: number;
  onDone: () => void;
}

function TaskStatusIcon({ status }: { status: PipelineTaskStatus }) {
  if (status === "completed") {
    return <span className="text-[#86efac]">✓</span>;
  }
  if (status === "failed") {
    return <span className="text-[#fda4af]">✗</span>;
  }
  if (status === "running") {
    return (
      <span className="inline-block animate-spin text-[#f8d977]">⟳</span>
    );
  }
  if (status === "skipped") {
    return <span className="text-[#8ea4b3]">—</span>;
  }
  return <span className="text-[#8ea4b3]">◦</span>;
}

export function PipelineProgressModal({
  entityType,
  entityId,
  onDone,
}: PipelineProgressModalProps) {
  const { pipeline, isPolling } = usePipelinePolling(
    entityType,
    entityId,
    "pending",
    () => {
      window.setTimeout(onDone, 1500);
    },
  );

  const status = pipeline?.pipeline_status ?? "pending";
  const progress = pipeline?.progress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b1720] p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          {isPolling ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f5c518] border-t-transparent" />
          ) : null}
          {status === "completed" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#34d399] text-sm font-bold text-black">
              ✓
            </div>
          ) : null}
          {status === "failed" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fb7185] text-sm font-bold text-white">
              ✗
            </div>
          ) : null}
          <h2 className="text-lg font-bold text-white">
            {isPolling ? "در حال پردازش محتوا..." : ""}
            {status === "completed" ? "انتشار با موفقیت انجام شد" : ""}
            {status === "failed" ? "خطا در پردازش" : ""}
          </h2>
        </div>

        {progress ? (
          <div className="mb-6">
            <div className="mb-1 flex justify-between text-sm text-[#8ea4b3]">
              <span>
                {progress.completed} از {progress.total} مرحله
              </span>
              <span>{progress.percent}٪</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#f5c518] transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        ) : null}

        {pipeline?.tasks ? (
          <ul className="space-y-2">
            {pipeline.tasks.map((task) => (
              <li key={task.task_key} className="flex items-center gap-2 text-sm">
                <TaskStatusIcon status={task.status} />
                <span
                  className={
                    task.status === "failed" && !task.is_critical
                      ? "text-[#8ea4b3]"
                      : "text-[#dde7ed]"
                  }
                >
                  {task.task_label}
                  {!task.is_critical ? (
                    <span className="mr-1 text-xs text-[#8ea4b3]">(اختیاری)</span>
                  ) : null}
                </span>
                {task.status === "failed" && task.error ? (
                  <span className="mr-auto text-xs text-[#fda4af]">{task.error}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {status === "failed" && pipeline?.error_summary ? (
          <div className="mt-4 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 p-3 text-sm text-[#fda4af]">
            {pipeline.error_summary}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          {status === "failed" ? (
            <button
              type="button"
              onClick={onDone}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-[#dde7ed] transition hover:bg-white/5"
            >
              بازگشت به لیست
            </button>
          ) : null}
          {isPolling ? (
            <p className="self-center text-xs text-[#8ea4b3]">
              صفحه را نبندید — این عملیات در پس‌زمینه ادامه دارد.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
