export type ParsedCue = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
};

/**
 * Parses WebVTT and SRT subtitle files into cached cues.
 */
export class SubtitleEngine {
  private cues: ParsedCue[] = [];
  private cacheKey = "";

  /** Parse subtitle body and cache cues. */
  parse(body: string, cacheKey: string): ParsedCue[] {
    if (cacheKey === this.cacheKey && this.cues.length > 0) {
      return this.cues;
    }

    const trimmed = body.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
    this.cues = trimmed.startsWith("WEBVTT")
      ? this.parseWebVtt(trimmed)
      : /^\d+\s*\n/m.test(trimmed)
        ? this.parseSrt(trimmed)
        : this.parseWebVtt(trimmed);
    this.cacheKey = cacheKey;
    return this.cues;
  }

  /** Get active cue lines at a given time with optional delay offset. */
  getActiveLines(currentTime: number, delaySeconds = 0): string[] {
    const t = currentTime + delaySeconds;
    return this.cues
      .filter((cue) => t >= cue.startTime && t <= cue.endTime)
      .flatMap((cue) =>
        cue.text
          .replace(/<[^>]+>/g, "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      );
  }

  clear(): void {
    this.cues = [];
    this.cacheKey = "";
  }

  private parseWebVtt(body: string): ParsedCue[] {
    const cues: ParsedCue[] = [];
    const blocks = body.split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.split("\n").filter(Boolean);
      if (lines.length < 2) {
        continue;
      }

      let timeLineIndex = 0;
      if (!lines[0].includes("-->") && lines.length > 1) {
        timeLineIndex = 1;
      }

      const timeLine = lines[timeLineIndex];
      if (!timeLine?.includes("-->")) {
        continue;
      }

      const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
      const startTime = this.parseTimestamp(startRaw);
      const endTime = this.parseTimestamp(endRaw.split(" ")[0]);

      if (startTime === null || endTime === null) {
        continue;
      }

      const text = lines.slice(timeLineIndex + 1).join("\n").trim();
      if (!text) {
        continue;
      }

      cues.push({
        id: `${startTime}-${endTime}-${cues.length}`,
        startTime,
        endTime,
        text,
      });
    }

    return cues;
  }

  private parseSrt(body: string): ParsedCue[] {
    const cues: ParsedCue[] = [];
    const blocks = body.split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.split("\n").filter((l) => l.trim());
      if (lines.length < 3) {
        continue;
      }

      const timeLine = lines.find((l) => l.includes("-->"));
      if (!timeLine) {
        continue;
      }

      const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
      const startTime = this.parseTimestamp(startRaw.replace(",", "."));
      const endTime = this.parseTimestamp(endRaw.replace(",", ".").split(" ")[0]);

      if (startTime === null || endTime === null) {
        continue;
      }

      const timeIndex = lines.indexOf(timeLine);
      const text = lines.slice(timeIndex + 1).join("\n").trim();

      cues.push({
        id: `srt-${cues.length}`,
        startTime,
        endTime,
        text,
      });
    }

    return cues;
  }

  private parseTimestamp(raw: string): number | null {
    const parts = raw.trim().split(":");
    if (parts.length < 2) {
      return null;
    }

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (parts.length === 3) {
      hours = Number(parts[0]);
      minutes = Number(parts[1]);
      seconds = Number(parts[2]);
    } else {
      minutes = Number(parts[0]);
      seconds = Number(parts[1]);
    }

    if (!Number.isFinite(hours + minutes + seconds)) {
      return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
  }
}
