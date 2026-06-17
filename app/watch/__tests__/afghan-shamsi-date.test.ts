import { describe, expect, it } from "vitest";
import { formatAfghanShamsiDate } from "../../lib/date-format";

describe("formatAfghanShamsiDate", () => {
  it("formats ISO dates in Afghan Shamsi calendar", () => {
    const formatted = formatAfghanShamsiDate("2026-06-15T10:00:00.000Z");
    expect(formatted).not.toBe("نامشخص");
    expect(formatted.length).toBeGreaterThan(4);
  });
});
