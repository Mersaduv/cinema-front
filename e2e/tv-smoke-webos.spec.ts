import { expect, test } from "@playwright/test";

const WEBOS_UA =
  "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager";

test.describe("TV browser smoke — unified UI (webOS / LG UA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((ua) => {
      Object.defineProperty(navigator, "userAgent", {
        get: () => ua,
        configurable: true,
      });
    }, WEBOS_UA);
  });

  test("/movies — desktop chrome, header, desktop filter dropdowns", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    await expect(page.locator('[data-tv-unified-ui="true"]')).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("aside[aria-label='منوی اصلی']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "ژانر", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "امتیاز IMDB", exact: true })).toBeVisible();
  });

  test("filter dropdown — genre panel opens and closes with Escape", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    const genreTrigger = page.getByRole("button", { name: "ژانر", exact: true });
    await genreTrigger.click();

    const panel = page.getByRole("dialog", { name: "ژانر" });
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(genreTrigger).toBeFocused();
  });

  test("/login — TvLoginPanel shows activation code", async ({ page }) => {
    await page.route("**/api/v1/tv/activate/request", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            code: "WXYZ-5678",
            expires_at: new Date(Date.now() + 600_000).toISOString(),
            expires_in: 600,
            pair_url: "/tv-login",
          },
        }),
      });
    });
    await page.route("**/api/v1/tv/activate/poll*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { status: "pending", expires_at: new Date().toISOString() },
        }),
      });
    });

    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(page.getByText("WXYZ-5678")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("ورود با گوگل")).toHaveCount(0);
  });

  test("filter dropdown — genre panel closes with webOS Back key", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    const genreTrigger = page.getByRole("button", { name: "ژانر", exact: true });
    await genreTrigger.click();

    const panel = page.getByRole("dialog", { name: "ژانر" });
    await expect(panel).toBeVisible();

    await page.keyboard.press("BrowserBack");
    await expect(panel).toHaveCount(0);
    await expect(genreTrigger).toBeFocused();
  });

  test("watch page — hls.js engine badge on webOS UA", async ({ page, request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8005/api";
    const list = await request.get(`${apiBase}/movies?per_page=1`);
    expect(list.ok()).toBeTruthy();
    const json = (await list.json()) as {
      data?: { movies?: Array<{ slug: string }> };
    };
    const slug = json.data?.movies?.[0]?.slug;
    test.skip(!slug, "No published movies in API — seed catalog first");

    const manifestBody = [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "#EXT-X-TARGETDURATION:10",
      "#EXTINF:10.0,",
      "https://cdn.example.com/seg0.ts",
      "#EXT-X-ENDLIST",
    ].join("\n");

    await page.route("**/api/playback/manifest**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/vnd.apple.mpegurl",
        body: manifestBody,
      });
    });

    await page.goto(`/watch/${slug}`, { waitUntil: "domcontentloaded", timeout: 60_000 });

    await expect(page.getByText("Adaptive HLS")).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("video.cinema-player-video")).toHaveCount(1);
  });
});
