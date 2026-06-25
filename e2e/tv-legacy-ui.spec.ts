import { expect, test } from "@playwright/test";

const TIZEN_UA =
  "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/56.0.2987.98 TV Safari/537.36";

/**
 * Requires dev server started with NEXT_PUBLIC_UNIFIED_TV_UI=0
 * (NEXT_PUBLIC_* is baked in at build/start time).
 */
test.describe("TV browser smoke — legacy sidebar UI (Tizen UA)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_LEGACY_TV_UI !== "1",
      "Set PLAYWRIGHT_LEGACY_TV_UI=1 and start Next with NEXT_PUBLIC_UNIFIED_TV_UI=0",
    );

    await page.addInitScript((ua) => {
      Object.defineProperty(navigator, "userAgent", {
        get: () => ua,
        configurable: true,
      });
    }, TIZEN_UA);
  });

  test("/movies — sidebar, no header, filter sheet opener", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    await expect(page.locator('[data-tv-unified-ui="true"]')).toHaveCount(0);
    await expect(page.locator("aside[aria-label='منوی اصلی']")).toBeVisible();
    await expect(page.locator("header")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "فیلترها", exact: true })).toBeVisible();
  });

  test("filter sheet — sections + focus restore", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    const opener = page.getByRole("button", { name: "فیلترها", exact: true });
    await opener.click();

    const sheet = page.getByRole("dialog", { name: "فیلترها" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "ژانر" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "کشور" })).toBeVisible();

    await sheet.getByRole("button", { name: "بستن" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});
