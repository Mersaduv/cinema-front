const mojibakePattern = /[ÃƒÃ‚Ã˜Ã™]/;

function hasMojibake(value?: string | null): boolean {
  return Boolean(value && mojibakePattern.test(value));
}

/** Attempt to repair UTF-8 mojibake in track labels. */
export function repairPotentialMojibake(value?: string | null): string {
  if (!value) {
    return "";
  }

  let current = value.trim();

  for (let index = 0; index < 3; index += 1) {
    if (!mojibakePattern.test(current)) {
      break;
    }

    const bytes = Uint8Array.from(current, (character) => character.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8").decode(bytes).replace(/\uFFFD/g, "").trim();

    if (!repaired || repaired === current) {
      break;
    }

    current = repaired;
  }

  return current;
}

export function normalizeAudioOptionLabel(label: string, language?: string): string {
  const normalizedLabel = repairPotentialMojibake(label);
  const normalizedLanguage = repairPotentialMojibake(language).toLowerCase();

  if (
    normalizedLabel === "دوبله" ||
    normalizedLabel === "دوبله فارسی" ||
    normalizedLabel.toLowerCase() === "dubbed" ||
    normalizedLanguage === "fa"
  ) {
    return "دوبله فارسی";
  }

  if (
    normalizedLabel === "زبان اصلی" ||
    normalizedLabel.toLowerCase() === "original" ||
    ((normalizedLanguage === "und" || normalizedLanguage === "original") &&
      (normalizedLabel === "" || hasMojibake(label)))
  ) {
    return "زبان اصلی";
  }

  return normalizedLabel || "صوت";
}

export function normalizeSubtitleOptionLabel(label: string, language?: string): string {
  const normalizedLabel = repairPotentialMojibake(label);
  const normalizedLanguage = repairPotentialMojibake(language).toLowerCase();

  if (
    normalizedLabel === "فارسی" ||
    normalizedLabel === "زیرنویس" ||
    normalizedLabel === "زیرنویس فارسی" ||
    normalizedLabel.toLowerCase() === "persian" ||
    normalizedLabel.toLowerCase() === "farsi" ||
    normalizedLanguage === "fa" ||
    normalizedLanguage === "fas" ||
    normalizedLanguage === "per"
  ) {
    return "زیرنویس فارسی";
  }

  return normalizedLabel || "زیرنویس";
}

export function getQualityLabel(height?: number, fallback?: string): string {
  if (height) {
    return `${height}p`;
  }

  return fallback || "کیفیت";
}

export function getQualityDetail(width?: number, height?: number, bitrate?: number): string {
  const resolution = width && height ? `${width}x${height}` : "Adaptive";

  if (!bitrate) {
    return resolution;
  }

  return `${resolution} • ${Math.round(bitrate / 1000)} kbps`;
}
