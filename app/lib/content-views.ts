import { apiClient } from "./api";
import { getDeviceId } from "../features/player/services/deviceId";

export type ContentViewMediaType = "movie" | "series";

export interface RecordContentViewPayload {
  media_type: ContentViewMediaType;
  media_id: number;
  watch_seconds: number;
  view_session_id: string;
  device_id?: string;
}

export interface RecordContentViewResult {
  recorded: boolean;
  views_count: number;
}

/** Fire-and-forget view beacon (deduped per view_session_id). */
export async function recordContentView(
  payload: RecordContentViewPayload,
): Promise<void> {
  try {
    await apiClient.post<RecordContentViewResult>("/v1/content-views", {
      ...payload,
      device_id: payload.device_id ?? getDeviceId(),
    });
  } catch {
  }
}
