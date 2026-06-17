import { describe, expect, it } from "vitest";
import { SubtitleEngine } from "../core/SubtitleEngine";

describe("SubtitleEngine", () => {
  const engine = new SubtitleEngine();

  it("parses WebVTT cues", () => {
    const body = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello world

00:00:04.000 --> 00:00:06.000
Second line`;

    const cues = engine.parse(body, "test-vtt");
    expect(cues).toHaveLength(2);
    expect(engine.getActiveLines(2)).toContain("Hello world");
    expect(engine.getActiveLines(5)).toContain("Second line");
  });

  it("applies subtitle delay offset", () => {
    const body = `WEBVTT

00:00:10.000 --> 00:00:12.000
Delayed cue`;

    engine.parse(body, "delay-test");
    expect(engine.getActiveLines(10, 0)).toContain("Delayed cue");
    expect(engine.getActiveLines(10, -2)).toEqual([]);
    expect(engine.getActiveLines(8, 0)).toEqual([]);
    expect(engine.getActiveLines(8, 2)).toContain("Delayed cue");
  });

  it("parses SRT format", () => {
    const body = `1
00:00:01,000 --> 00:00:03,000
SRT line one

2
00:00:04,000 --> 00:00:06,000
SRT line two`;

    const cues = engine.parse(body, "srt-test");
    expect(cues.length).toBeGreaterThanOrEqual(1);
    expect(engine.getActiveLines(2)).toContain("SRT line one");
  });

  it("strips HTML markup from cues", () => {
    const body = `WEBVTT

00:00:00.000 --> 00:00:02.000
<b>Bold</b> text`;

    engine.parse(body, "html-test");
    expect(engine.getActiveLines(1)).toContain("Bold text");
  });
});
