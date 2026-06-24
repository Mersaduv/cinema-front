import { expect, test } from "@playwright/test";

const TIZEN_UA =
  "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/56.0.2987.98 TV Safari/537.36";

test.describe("TV browser smoke (Tizen UA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((ua) => {
      Object.defineProperty(navigator, "userAgent", {
        get: () => ua,
        configurable: true,
      });
    }, TIZEN_UA);
  });

  test("/movies — sidebar, TV page chrome, filter opener", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    await expect(page.locator("aside[aria-label='منوی اصلی']")).toBeVisible();
    await expect(page.locator("header")).toHaveCount(0);
    await expect(page.locator('[data-tv-page="true"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "فیلترها", exact: true })).toBeVisible();
    const grid = page.locator('[data-tv-grid="poster"]');
    const empty = page.getByText("هنوز موردی در این بخش منتشر نشده است");
    await expect(grid.or(empty)).toBeVisible();
  });

  test("/series — same TV catalog chrome", async ({ page }) => {
    await page.goto("/series", { waitUntil: "networkidle" });

    await expect(page.locator("aside[aria-label='منوی اصلی']")).toBeVisible();
    await expect(page.getByRole("button", { name: "فیلترها", exact: true })).toBeVisible();
    const grid = page.locator('[data-tv-grid="poster"]');
    const empty = page.getByText("هنوز موردی در این بخش منتشر نشده است");
    await expect(grid.or(empty)).toBeVisible();
  });

  test("filter sheet — country/language/year sections + focus restore", async ({ page }) => {
    await page.goto("/movies", { waitUntil: "networkidle" });

    const opener = page.getByRole("button", { name: "فیلترها", exact: true });
    await opener.click();

    const sheet = page.getByRole("dialog", { name: "فیلترها" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "ژانر" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "کشور" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "زبان" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "سال" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "امتیاز IMDB" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "مرتب‌سازی" })).toBeVisible();
    await expect(sheet.locator("xpath=ancestor::body")).toHaveCount(1);

    await sheet.getByRole("button", { name: "بستن" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(opener).toBeFocused();
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
});
