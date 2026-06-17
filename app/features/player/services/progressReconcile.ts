import { PROGRESS_CONSTANTS } from "./progress.types";
import type { WatchProgressRecord } from "./progress.types";

export type ResumeDecision = {
  resumeTime: number;
  showPrompt: boolean;
  source: "local" | "server" | "none";
};

export function reconcileResumeTime(
  local: WatchProgressRecord | null,
  serverCurrentTime: number | null,
): ResumeDecision {
  if (!local && (serverCurrentTime === null || serverCurrentTime <= 0)) {
    return { resumeTime: 0, showPrompt: false, source: "none" };
  }

  const localTime = local?.currentTime ?? 0;
  const serverTime = serverCurrentTime ?? 0;

  let resumeTime = localTime;

  if (serverTime > localTime + PROGRESS_CONSTANTS.RECONCILE_TOLERANCE_SECONDS) {
    resumeTime = serverTime;
  } else if (
    Math.abs(localTime - serverTime) < PROGRESS_CONSTANTS.RECONCILE_TOLERANCE_SECONDS
  ) {
    resumeTime = localTime;
  } else if (localTime > 0) {
    resumeTime = localTime;
  } else {
    resumeTime = serverTime;
  }

  const percent =
    local?.percentWatched ??
    (local?.duration ? (resumeTime / local.duration) * 100 : 0);

  const showPrompt =
    resumeTime >= PROGRESS_CONSTANTS.RESUME_MIN_SECONDS &&
    percent < PROGRESS_CONSTANTS.COMPLETION_THRESHOLD_PERCENT;

  const source: ResumeDecision["source"] =
    serverTime > localTime + PROGRESS_CONSTANTS.RECONCILE_TOLERANCE_SECONDS
      ? "server"
      : local
        ? "local"
        : "server";

  return { resumeTime, showPrompt, source };
}

export function computePercentWatched(currentTime: number, duration: number): number {
  if (duration <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((currentTime / duration) * 10000) / 100);
}

export function isCompletedPercent(percentWatched: number): boolean {
  return percentWatched >= PROGRESS_CONSTANTS.COMPLETION_THRESHOLD_PERCENT;
}
