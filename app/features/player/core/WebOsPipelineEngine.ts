import type { EngineId } from "../types/playback.types";
import { NativeHlsEngine } from "./NativeHlsEngine";

/**
 * LG webOS Media Pipeline path — uses native HLS with webOS-specific source hints.
 */
export class WebOsPipelineEngine extends NativeHlsEngine {
  override readonly id: EngineId = "webos-pipeline";

  attach(video: HTMLVideoElement, src: string): void {
    super.attach(video, src);

    const webOS = (window as Window & {
      webOS?: { platform?: { tv?: boolean } };
    }).webOS;

    if (webOS?.platform?.tv) {
      video.setAttribute("type", "application/x-mpegURL");
    }
  }
}
