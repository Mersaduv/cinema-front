import { describe, expect, it } from "vitest";
import { CinemaBandwidthEstimator } from "../CinemaBandwidthEstimator";

const baseSample = {
  contentDurationSec: 4,
  levelIndex: 0,
  timestamp: 1000,
};

describe("CinemaBandwidthEstimator", () => {
  it("returns null estimate with fewer than 2 samples", () => {
    const est = new CinemaBandwidthEstimator();
    est.onSegmentLoaded({
      ...baseSample,
      bytesLoaded: 500_000,
      durationMs: 1000,
    });

    expect(est.getEstimateBps()).toBeNull();
  });

  it("estimate is conservative — uses min of fast and slow EWMA", () => {
    const est = new CinemaBandwidthEstimator({ safetyFactor: 0.85 });

    est.onSegmentLoaded({
      ...baseSample,
      bytesLoaded: 5_000_000,
      durationMs: 1000,
    });
    est.onSegmentLoaded({
      ...baseSample,
      bytesLoaded: 3_000_000,
      durationMs: 1000,
    });

    const estimate = est.getEstimateBps();
    expect(estimate).not.toBeNull();
    expect(estimate!).toBeLessThan(40_000_000);
    expect(estimate!).toBeGreaterThan(0);
  });

  it("detects bandwidth drop when fast EWMA falls below slow EWMA", () => {
    const est = new CinemaBandwidthEstimator();

    for (let i = 0; i < 5; i++) {
      est.onSegmentLoaded({
        ...baseSample,
        bytesLoaded: 10_000_000,
        durationMs: 1000,
      });
    }

    for (let i = 0; i < 3; i++) {
      est.onSegmentLoaded({
        ...baseSample,
        bytesLoaded: 200_000,
        durationMs: 1000,
      });
    }

    expect(est.isBandwidthDropping()).toBe(true);
  });

  it("cold start hint is zero without network info", () => {
    const est = new CinemaBandwidthEstimator();
    expect(est.getColdStartHintBps()).toBe(0);
  });
});
