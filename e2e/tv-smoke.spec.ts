import { expect, test } from "@playwright/test";

const TIZEN_UA =
  "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/56.0.2987.98 TV Safari/537.36";

test.describe("TV browser smoke — unified UI (Tizen UA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((ua) => {
      Object.defineProperty(navigator, "userAgent", {
        get: () => ua,
        configurable: true,
      });
    }, TIZEN_UA);
  });

  test("/movies — desktop chrome, header, desktop filter dropdowns", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    await expect(page.locator('[data-tv-unified-ui="true"]')).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("aside[aria-label='منوی اصلی']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "فیلترها", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "ژانر", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "امتیاز IMDB", exact: true })).toBeVisible();

    const grid = page.locator('[data-tv-grid="poster"]');
    const empty = page.getByText("هنوز موردی در این بخش منتشر نشده است");
    await expect(grid.or(empty)).toBeVisible();
  });

  test("/series — same unified catalog chrome", async ({ page }) => {
    await page.goto("/series", { waitUntil: "networkidle" });

    await expect(page.locator('[data-tv-unified-ui="true"]')).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("aside[aria-label='منوی اصلی']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "ژانر", exact: true })).toBeVisible();

    const grid = page.locator('[data-tv-grid="poster"]');
    const empty = page.getByText("هنوز موردی در این بخش منتشر نشده است");
    await expect(grid.or(empty)).toBeVisible();
  });

  test("filter dropdown — genre panel opens as dialog on TV", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    const genreTrigger = page.getByRole("button", { name: "ژانر", exact: true });
    await genreTrigger.click();

    const panel = page.getByRole("dialog", { name: "ژانر" });
    await expect(panel).toBeVisible();
    await expect(panel.locator("xpath=ancestor::body")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(genreTrigger).toBeFocused();
  });

  test("/movies — dub/subtitle badges stay at top of poster cards", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    const badge = page.locator("[data-tv-poster-badge]").first();
    const hasBadge = (await badge.count()) > 0;
    test.skip(!hasBadge, "No dubbed/subtitle badges in catalog — seed content first");

    const placement = await badge.evaluate((node) => {
      const shell = node.closest("[data-tv-poster-shell]");
      if (!shell) {
        return null;
      }

      const shellRect = shell.getBoundingClientRect();
      const badgeRect = node.getBoundingClientRect();
      const badgeCenterY = badgeRect.top + badgeRect.height / 2;
      const shellMidY = shellRect.top + shellRect.height / 2;

      return {
        nearTop: badgeRect.top - shellRect.top < shellRect.height * 0.25,
        aboveMidline: badgeCenterY < shellMidY,
      };
    });

    expect(placement?.nearTop).toBe(true);
    expect(placement?.aboveMidline).toBe(true);
  });

  test("/login — TvLoginPanel shows activation code", async ({ page }) => {
    await page.route("**/api/v1/tv/activate/request", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            code: "ABCD-1234",
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
    await expect(page.getByText("ABCD-1234")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("ورود با گوگل")).toHaveCount(0);
  });

  test("/movies/[slug] — Play CTA, no YouTube iframe", async ({ page, request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8005/api";
    const list = await request.get(`${apiBase}/movies?per_page=1`);
    expect(list.ok()).toBeTruthy();
    const json = (await list.json()) as { data?: { movies?: Array<{ slug: string }> } };
    const slug = json.data?.movies?.[0]?.slug;
    test.skip(!slug, "No published movies in API — seed catalog first");

    await page.goto(`/movies/${slug}`, { waitUntil: "networkidle" });
    await expect(page.locator('a[data-tv-focusable]').filter({ hasText: /تماشا/ })).toBeVisible();
    await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
  });

  test("/series/[slug] — episodes fetch only after tab activation", async ({ page, request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8005/api";
    const list = await request.get(`${apiBase}/series?per_page=1`);
    expect(list.ok()).toBeTruthy();
    const json = (await list.json()) as { data?: { series?: Array<{ slug: string }> } };
    const slug = json.data?.series?.[0]?.slug;
    test.skip(!slug, "No published series in API — seed catalog first");

    const episodeRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (/\/api\/series\/[^/]+\/episodes/.test(url)) {
        episodeRequests.push(url);
      }
    });

    await page.goto(`/series/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    expect(episodeRequests.length).toBe(0);

    await page.getByRole("tab", { name: "قسمت های سریال" }).click();
    await page.waitForTimeout(3000);
    expect(episodeRequests.length).toBeGreaterThan(0);
  });

  test("filter dropdown — genre panel closes with Tizen Back key", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    const genreTrigger = page.getByRole("button", { name: "ژانر", exact: true });
    await genreTrigger.click();

    const panel = page.getByRole("dialog", { name: "ژانر" });
    await expect(panel).toBeVisible();

    await page.keyboard.press("BrowserBack");
    await expect(panel).toHaveCount(0);
    await expect(genreTrigger).toBeFocused();
  });

  test("watch page — hls.js engine badge on Tizen UA", async ({ page, request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8005/api";
    const list = await request.get(`${apiBase}/movies?per_page=1`);
    expect(list.ok()).toBeTruthy();
    const json = (await list.json()) as {
      data?: { movies?: Array<{ slug: string; hls_url?: string | null }> };
    };
    const movie = json.data?.movies?.[0];
    test.skip(!movie?.slug, "No published movies in API — seed catalog first");

    const manifestBody = [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "#EXT-X-TARGETDURATION:10",
      "#EXTINF:10.0,",
      "https://cdn.example.com/seg0.ts",
      "#EXT-X-ENDLIST",
    ].join("\n");

    await page.route("**/edge/playback/manifest**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/vnd.apple.mpegurl",
        body: manifestBody,
      });
    });

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto(`/watch/${movie.slug}`, { waitUntil: "domcontentloaded", timeout: 60_000 });

    const engineBadge = page.getByText("Adaptive HLS");
    await expect(engineBadge).toBeVisible({ timeout: 45_000 });

    const video = page.locator("video.cinema-player-video");
    await expect(video).toHaveCount(1);

    expect(consoleErrors.filter((e) => !/favicon/i.test(e))).toEqual([]);
  });
});
