import { describe, expect, it } from "vitest";
import {
  CONTENT_REQUEST_DESCRIPTION_MIN,
  validateContentRequestForm,
} from "../../lib/content-requests";

describe("validateContentRequestForm", () => {
  it("rejects empty title and genre", () => {
    expect(
      validateContentRequestForm({
        title: "",
        genreSlug: "",
        description: "a".repeat(CONTENT_REQUEST_DESCRIPTION_MIN),
      }),
    ).toBe("نام فیلم یا سریال را وارد کنید.");
  });

  it("accepts valid payload", () => {
    expect(
      validateContentRequestForm({
        title: "Dark",
        genreSlug: "mystery",
        description: "Please add with Persian subtitles.",
      }),
    ).toBeNull();
  });
});
