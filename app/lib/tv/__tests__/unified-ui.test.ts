import { afterEach, describe, expect, it, vi } from "vitest";

const ENV_KEY = "NEXT_PUBLIC_UNIFIED_TV_UI";

describe("isUnifiedTvUiEnabled", () => {
  const previous = process.env[ENV_KEY];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = previous;
    }
    vi.resetModules();
  });

  async function load() {
    vi.resetModules();
    return import("../unified-ui");
  }

  it("defaults to unified UI when env is unset", async () => {
    delete process.env[ENV_KEY];
    const { isUnifiedTvUiEnabled, isLegacyTvUiEnabled } = await load();
    expect(isUnifiedTvUiEnabled()).toBe(true);
    expect(isLegacyTvUiEnabled()).toBe(false);
  });

  it("disables unified UI for legacy sentinel values", async () => {
    for (const value of ["0", "false", "off", "legacy"]) {
      process.env[ENV_KEY] = value;
      const { isUnifiedTvUiEnabled, isLegacyTvUiEnabled } = await load();
      expect(isUnifiedTvUiEnabled()).toBe(false);
      expect(isLegacyTvUiEnabled()).toBe(true);
    }
  });

  it("keeps unified UI for explicit enable values", async () => {
    for (const value of ["1", "true", "on"]) {
      process.env[ENV_KEY] = value;
      const { isUnifiedTvUiEnabled } = await load();
      expect(isUnifiedTvUiEnabled()).toBe(true);
    }
  });
});
