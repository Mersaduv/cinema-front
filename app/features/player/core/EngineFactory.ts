import { ExoPlayerBridgeEngine } from "./ExoPlayerBridgeEngine";
import { HLSEngine } from "./HLSEngine";
import { NativeHlsEngine } from "./NativeHlsEngine";
import { ProgressiveEngine } from "./ProgressiveEngine";
import { ShakaEngine } from "./ShakaEngine";
import { TizenAvPlayEngine } from "./TizenAvPlayEngine";
import { WebOsPipelineEngine } from "./WebOsPipelineEngine";
import type {
  DeviceCapabilities,
  EngineId,
  EngineOptions,
  PlaybackEngine,
} from "../types/playback.types";

export class EngineFactory {
  static create(
    engineId: EngineId,
    options: EngineOptions,
    capabilities?: DeviceCapabilities,
  ): PlaybackEngine {
    switch (engineId) {
      case "tizen-avplay":
        return new TizenAvPlayEngine(options);
      case "webos-pipeline":
        return new WebOsPipelineEngine(options);
      case "exo-bridge":
        return new ExoPlayerBridgeEngine(options);
      case "shaka":
        return new ShakaEngine(options);
      case "native-hls":
        return new NativeHlsEngine(options);
      case "progressive":
        return new ProgressiveEngine(options);
      case "hlsjs":
      default:
        return new HLSEngine({
          ...options,
          enableWorker: capabilities?.preferWorker ?? true,
          performanceClass: capabilities?.performanceClass,
        });
    }
  }
}
