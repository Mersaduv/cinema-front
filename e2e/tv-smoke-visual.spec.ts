import { expect, test } from "@playwright/test";
import { TIZEN_UA, installTvCompat, installTvUserAgent } from "./tv-helpers";

test.describe("TV visual parity — catalog @ 1920×1080", () => {
  test.beforeEach(async ({ page }) => {
    await installTvUserAgent(page, TIZEN_UA);
    await installTvCompat(page);
  });

  test("/movies layout matches stored baseline", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    await expect(page.locator('[data-tv-unified-ui="true"]')).toBeVisible();
    await expect(page.locator("header")).toBeVisible();

    await expect(page).toHaveScreenshot("movies-catalog-tv-1920.png", {
      maxDiffPixels: 120,
      fullPage: false,
    });
  });
});
