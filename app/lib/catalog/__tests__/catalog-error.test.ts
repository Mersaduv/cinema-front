import { describe, expect, it } from "vitest";
import { resolveVisibleCatalogError, sanitizeCatalogError } from "../catalog-error";

describe("catalog error display", () => {
  it("does not keep the server fetch failed banner after the list arrives", () => {
    expect(
      resolveVisibleCatalogError({
        dataError: "",
        initialError: "fetch failed",
        hasSettledData: true,
        itemCount: 24,
        isInitialQuery: true,
      }),
    ).toBe("");
  });

  it("still reports a failed load when nothing was returned", () => {
    expect(
      resolveVisibleCatalogError({
        dataError: "fetch failed",
        hasSettledData: true,
        itemCount: 0,
        isInitialQuery: true,
      }),
    ).toBe("دریافت فهرست انجام نشد.");
  });

  it("maps the raw Node transport error", () => {
    expect(sanitizeCatalogError("fetch failed")).toBe("دریافت فهرست انجام نشد.");
  });
});
