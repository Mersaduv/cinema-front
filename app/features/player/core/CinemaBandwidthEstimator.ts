export type SegmentSample = {
  bytesLoaded: number;
  durationMs: number;
  contentDurationSec: number;
  levelIndex: number;
  timestamp: number;
};

export type CinemaBandwidthEstimatorOptions = {
  safetyFactor?: number;
  upgradeSafetyFactor?: number;
};

/**
 * Real-time bandwidth tracker — EWMA over segment downloads for ABR decisions.
 */
export class CinemaBandwidthEstimator {
  private readonly SAMPLE_WINDOW = 10;
  private readonly FAST_EWMA_HALF_LIFE = 2;
  private readonly SLOW_EWMA_HALF_LIFE = 5;
  private readonly SAFETY_FACTOR: number;
  private readonly UPGRADE_SAFETY_FACTOR: number;
  private readonly MIN_SAMPLES_TO_TRUST = 2;

  private samples: SegmentSample[] = [];
  private fastEwma = 0;
  private slowEwma = 0;
  private sampleCount = 0;
  private networkInfoHint: number | null = null;

  constructor(options?: CinemaBandwidthEstimatorOptions) {
    this.SAFETY_FACTOR = options?.safetyFactor ?? 0.85;
    this.UPGRADE_SAFETY_FACTOR = options?.upgradeSafetyFactor ?? 0.7;
    this.readNetworkInfoHint();
  }

  private readNetworkInfoHint(): void {
    if (typeof navigator === "undefined") {
      return;
    }

    const connection = (navigator as Navigator & {
      connection?: {
        downlink?: number;
        effectiveType?: string;
      };
    }).connection;

    if (!connection) {
      return;
    }

    const effectiveTypeMap: Record<string, number> = {
      "slow-2g": 50_000,
      "2g": 150_000,
      "3g": 500_000,
      "4g": 2_000_000,
    };

    const downlink = connection.downlink;
    if (typeof downlink === "number" && downlink > 0) {
      this.networkInfoHint = downlink * 1_000_000 * this.SAFETY_FACTOR;
    } else if (connection.effectiveType) {
      this.networkInfoHint = effectiveTypeMap[connection.effectiveType] ?? null;
    }
  }

  onSegmentLoaded(sample: SegmentSample): void {
    if (sample.durationMs <= 0 || sample.bytesLoaded <= 0) {
      return;
    }

    const speedBps = (sample.bytesLoaded * 8 * 1000) / sample.durationMs;

    const alphaFast = Math.pow(
      0.5,
      sample.durationMs / 1000 / this.FAST_EWMA_HALF_LIFE,
    );
    const alphaSlow = Math.pow(
      0.5,
      sample.durationMs / 1000 / this.SLOW_EWMA_HALF_LIFE,
    );

    if (this.sampleCount === 0) {
      this.fastEwma = speedBps;
      this.slowEwma = speedBps;
    } else {
      this.fastEwma = alphaFast * this.fastEwma + (1 - alphaFast) * speedBps;
      this.slowEwma = alphaSlow * this.slowEwma + (1 - alphaSlow) * speedBps;
    }

    this.samples.push(sample);
    if (this.samples.length > this.SAMPLE_WINDOW) {
      this.samples.shift();
    }
    this.sampleCount += 1;
  }

  getEstimateBps(): number | null {
    if (this.sampleCount < this.MIN_SAMPLES_TO_TRUST) {
      return null;
    }

    return Math.min(this.fastEwma, this.slowEwma) * this.SAFETY_FACTOR;
  }

  getUpgradeEstimateBps(): number | null {
    if (this.sampleCount < this.MIN_SAMPLES_TO_TRUST) {
      return null;
    }

    return this.slowEwma * this.UPGRADE_SAFETY_FACTOR;
  }

  getColdStartHintBps(): number {
    if (this.networkInfoHint && this.networkInfoHint > 0) {
      return this.networkInfoHint * 0.5;
    }

    return 0;
  }

  isBandwidthDropping(): boolean {
    if (this.sampleCount < 3) {
      return false;
    }

    return this.fastEwma < this.slowEwma * 0.7;
  }

  isBandwidthStable(): boolean {
    if (this.sampleCount < this.MIN_SAMPLES_TO_TRUST || this.slowEwma <= 0) {
      return false;
    }

    return Math.abs(this.fastEwma - this.slowEwma) / this.slowEwma < 0.15;
  }

  reset(): void {
    this.samples = [];
    this.fastEwma = 0;
    this.slowEwma = 0;
    this.sampleCount = 0;
  }

  getDebugInfo() {
    return {
      fastEwmaMbps: (this.fastEwma / 1_000_000).toFixed(2),
      slowEwmaMbps: (this.slowEwma / 1_000_000).toFixed(2),
      estimateMbps: ((this.getEstimateBps() ?? 0) / 1_000_000).toFixed(2),
      sampleCount: this.sampleCount,
      networkInfoHintMbps: this.networkInfoHint
        ? (this.networkInfoHint / 1_000_000).toFixed(2)
        : "none",
    };
  }
}
