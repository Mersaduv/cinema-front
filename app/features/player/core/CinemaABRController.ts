import type { CinemaBandwidthEstimator } from "./CinemaBandwidthEstimator";

export type HlsLevel = {
  bitrate: number;
  height: number;
};

export type ABRState = {
  currentLevelIndex: number;
  bufferAheadSeconds: number;
  availableLevels: HlsLevel[];
};

export type ABRDecisionReason =
  | "cold-start"
  | "upgrade"
  | "downgrade"
  | "emergency-downgrade"
  | "hold";

export type ABRDecision = {
  targetLevelIndex: number;
  reason: ABRDecisionReason;
};

export type CinemaABRControllerOptions = {
  upgradeStabilitySeconds?: number;
  emergencyBufferThresholdSeconds?: number;
  healthyBufferSeconds?: number;
  minUpgradeIntervalMs?: number;
  coldStartMaxLevel?: number;
};

/**
 * Quality decision engine — cold start, ramp-up, emergency downgrade.
 */
export class CinemaABRController {
  private readonly EMERGENCY_BUFFER_THRESHOLD_SECONDS: number;
  private readonly HEALTHY_BUFFER_SECONDS: number;
  private readonly MIN_UPGRADE_INTERVAL_MS: number;
  private readonly COLD_START_MAX_LEVEL: number;

  private lastSwitchTime = -Infinity;
  private lastUpgradeTime = -Infinity;

  constructor(
    private readonly estimator: CinemaBandwidthEstimator,
    options?: CinemaABRControllerOptions,
  ) {
    this.EMERGENCY_BUFFER_THRESHOLD_SECONDS =
      options?.emergencyBufferThresholdSeconds ?? 3;
    this.HEALTHY_BUFFER_SECONDS = options?.healthyBufferSeconds ?? 15;
    this.MIN_UPGRADE_INTERVAL_MS = options?.minUpgradeIntervalMs ?? 10_000;
    this.COLD_START_MAX_LEVEL = options?.coldStartMaxLevel ?? 2;
  }

  selectColdStartLevel(levels: HlsLevel[]): number {
    if (levels.length === 0) {
      return 0;
    }

    const hintBps = this.estimator.getColdStartHintBps();

    if (hintBps <= 0) {
      return 0;
    }

    const sorted = [...levels].sort((a, b) => a.bitrate - b.bitrate);
    let bestLevel = 0;

    for (let i = 0; i < sorted.length; i++) {
      const originalIndex = levels.findIndex(
        (level) => level.bitrate === sorted[i].bitrate && level.height === sorted[i].height,
      );
      if (sorted[i].bitrate <= hintBps) {
        bestLevel = originalIndex >= 0 ? originalIndex : i;
      } else {
        break;
      }
    }

    return Math.min(bestLevel, this.COLD_START_MAX_LEVEL);
  }

  decide(state: ABRState): ABRDecision {
    const now = performance.now();
    const { currentLevelIndex, bufferAheadSeconds, availableLevels } = state;

    if (availableLevels.length === 0) {
      return { targetLevelIndex: 0, reason: "hold" };
    }

    if (bufferAheadSeconds < this.EMERGENCY_BUFFER_THRESHOLD_SECONDS) {
      if (currentLevelIndex > 0) {
        this.lastSwitchTime = now;
        return { targetLevelIndex: 0, reason: "emergency-downgrade" };
      }

      return { targetLevelIndex: 0, reason: "hold" };
    }

    const estimateBps = this.estimator.getEstimateBps();
    const upgradeEstimateBps = this.estimator.getUpgradeEstimateBps();

    if (estimateBps === null) {
      return { targetLevelIndex: currentLevelIndex, reason: "hold" };
    }

    const currentBitrate = availableLevels[currentLevelIndex]?.bitrate ?? 0;
    const isBandwidthTooLow = estimateBps < currentBitrate * 0.8;
    const isBandwidthDropping = this.estimator.isBandwidthDropping();

    if ((isBandwidthTooLow || isBandwidthDropping) && currentLevelIndex > 0) {
      let targetLevel = 0;

      for (let i = availableLevels.length - 1; i >= 0; i--) {
        if (availableLevels[i].bitrate <= estimateBps * 0.85) {
          targetLevel = i;
          break;
        }
      }

      if (targetLevel < currentLevelIndex) {
        this.lastSwitchTime = now;
        return { targetLevelIndex: targetLevel, reason: "downgrade" };
      }
    }

    const timeSinceUpgrade = now - this.lastUpgradeTime;
    const isUpgradeCooldownOver = timeSinceUpgrade >= this.MIN_UPGRADE_INTERVAL_MS;
    const isBufferHealthy = bufferAheadSeconds >= this.HEALTHY_BUFFER_SECONDS;
    const isBandwidthStable = this.estimator.isBandwidthStable();
    const nextLevelIndex = currentLevelIndex + 1;

    if (
      isUpgradeCooldownOver &&
      nextLevelIndex < availableLevels.length &&
      upgradeEstimateBps !== null
    ) {
      const nextLevelBitrate = availableLevels[nextLevelIndex].bitrate;
      const bufferBonus = isBufferHealthy ? 1.1 : 1.0;
      const effectiveUpgradeCapacity = upgradeEstimateBps * bufferBonus;

      if (effectiveUpgradeCapacity >= nextLevelBitrate && isBandwidthStable) {
        let jumpTarget = nextLevelIndex;

        for (let i = nextLevelIndex + 1; i < availableLevels.length; i++) {
          if (effectiveUpgradeCapacity >= availableLevels[i].bitrate) {
            jumpTarget = i;
          } else {
            break;
          }
        }

        this.lastUpgradeTime = now;
        this.lastSwitchTime = now;
        return { targetLevelIndex: jumpTarget, reason: "upgrade" };
      }
    }

    return { targetLevelIndex: currentLevelIndex, reason: "hold" };
  }

  reset(): void {
    this.lastSwitchTime = -Infinity;
    this.lastUpgradeTime = -Infinity;
  }
}
