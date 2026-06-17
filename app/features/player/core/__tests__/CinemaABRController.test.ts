import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CinemaABRController } from "../CinemaABRController";
import { CinemaBandwidthEstimator } from "../CinemaBandwidthEstimator";

const levels = [
  { bitrate: 400_000, height: 240 },
  { bitrate: 800_000, height: 360 },
  { bitrate: 1_500_000, height: 480 },
  { bitrate: 3_000_000, height: 720 },
  { bitrate: 6_000_000, height: 1080 },
];

function feedBandwidth(estimator: CinemaBandwidthEstimator, bps: number): void {
  const bytes = (bps / 8) * 1;
  estimator.onSegmentLoaded({
    bytesLoaded: bytes,
    durationMs: 1000,
    contentDurationSec: 4,
    levelIndex: 0,
    timestamp: performance.now(),
  });
  estimator.onSegmentLoaded({
    bytesLoaded: bytes,
    durationMs: 1000,
    contentDurationSec: 4,
    levelIndex: 0,
    timestamp: performance.now(),
  });
}

describe("CinemaABRController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cold start returns level 0 when no network hint", () => {
    const estimator = new CinemaBandwidthEstimator();
    const controller = new CinemaABRController(estimator);

    expect(controller.selectColdStartLevel(levels)).toBe(0);
  });

  it("emergency downgrade goes to level 0 when buffer is critically low", () => {
    const estimator = new CinemaBandwidthEstimator();
    const controller = new CinemaABRController(estimator);

    feedBandwidth(estimator, 10_000_000);

    const decision = controller.decide({
      currentLevelIndex: 3,
      bufferAheadSeconds: 2,
      availableLevels: levels,
    });

    expect(decision.reason).toBe("emergency-downgrade");
    expect(decision.targetLevelIndex).toBe(0);
  });

  it("does not upgrade within 10s of last upgrade", () => {
    const estimator = new CinemaBandwidthEstimator();
    const controller = new CinemaABRController(estimator);

    feedBandwidth(estimator, 12_000_000);

    const first = controller.decide({
      currentLevelIndex: 0,
      bufferAheadSeconds: 20,
      availableLevels: levels,
    });

    expect(first.reason).toBe("upgrade");

    vi.advanceTimersByTime(8_000);

    const second = controller.decide({
      currentLevelIndex: first.targetLevelIndex,
      bufferAheadSeconds: 20,
      availableLevels: levels,
    });

    expect(second.reason).toBe("hold");
  });

  it("skips levels on fast ramp-up when bandwidth allows", () => {
    const estimator = new CinemaBandwidthEstimator();
    const controller = new CinemaABRController(estimator);

    feedBandwidth(estimator, 15_000_000);

    const decision = controller.decide({
      currentLevelIndex: 0,
      bufferAheadSeconds: 20,
      availableLevels: levels,
    });

    expect(decision.reason).toBe("upgrade");
    expect(decision.targetLevelIndex).toBeGreaterThan(1);
  });
});
