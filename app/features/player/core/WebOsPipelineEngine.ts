import type { EngineId } from "../types/playback.types";
import { NativeHlsEngine } from "./NativeHlsEngine";

/**
 * LG webOS Media Pipeline path — native HLS with webOS MIME hint.
 * Used when `window.webOS` is available (hosted TV app). Browser shells use hls.js via policy.
 */
export class WebOsPipelineEngine extends NativeHlsEngine {
  override readonly id: EngineId = "webos-pipeline";

  protected override getManifestMimeType(): string {
    return "application/x-mpegURL";
  }
}
