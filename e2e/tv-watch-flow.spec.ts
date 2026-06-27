import { expect, test } from "@playwright/test";
import {
  TIZEN_UA,
  createConsoleCollector,
  filterBenignConsoleErrors,
  installTvCompatAndQoeTap,
  installTvUserAgent,
  mockPlaybackManifest,
  pressTvBack,
  readQoeEngineSelected,
} from "./tv-helpers";

test.describe("TV watch flow — Tizen UA", () => {
  test.beforeEach(async ({ page }) => {
    await installTvUserAgent(page, TIZEN_UA);
    await installTvCompatAndQoeTap(page);
  });

  test("mount → play interaction → seek → quality menu → back chain", async ({
    page,
    request,
  }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8005/api";
    const list = await request.get(`${apiBase}/movies?per_page=1`);
    expect(list.ok()).toBeTruthy();
    const json = (await list.json()) as {
      data?: { movies?: Array<{ slug: string }> };
    };
    const slug = json.data?.movies?.[0]?.slug;
    test.skip(!slug, "No published movies in API — seed catalog first");

    const consoleErrors = createConsoleCollector(page);
    await mockPlaybackManifest(page);

    await page.goto(`/watch/${slug}`, { waitUntil: "domcontentloaded", timeout: 60_000 });

    await expect(page.getByText("Adaptive HLS")).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("video.cinema-player-video")).toHaveCount(1);

    const qoe = await readQoeEngineSelected(page);
    expect(qoe?.engineId).toBe("hlsjs");

    const playerRoot = page.locator("[data-player-shell], .cinema-player-video").first();
    await playerRoot.click({ force: true });

    const tvPlayGate = page.getByRole("button", { name: "پخش" });
    if ((await tvPlayGate.count()) > 0) {
      await tvPlayGate.focus();
      await page.keyboard.press("Enter");
    }

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");

    const qualityTrigger = page.getByRole("button", { name: /کیفیت:/ });
    if ((await qualityTrigger.count()) > 0) {
      await qualityTrigger.first().click();
      await expect(page.getByRole("listbox", { name: "کیفیت تصویر" })).toBeVisible();
      await pressTvBack(page);
      await expect(page.getByRole("listbox", { name: "کیفیت تصویر" })).toHaveCount(0);
    }

    const focused = await page.evaluate(() => {
      const active = document.activeElement;
      return Boolean(
        active &&
          active !== document.body &&
          (active as HTMLElement).offsetParent !== null,
      );
    });
    expect(focused).toBe(true);

    expect(filterBenignConsoleErrors(consoleErrors)).toEqual([]);
  });
});
