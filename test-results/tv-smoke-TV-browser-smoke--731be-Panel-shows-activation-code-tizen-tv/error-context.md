# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tv-smoke.spec.ts >> TV browser smoke — unified UI (Tizen UA) >> /login — TvLoginPanel shows activation code
- Location: e2e\tv-smoke.spec.ts:87:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "networkidle"

```

# Test source

```ts
  14  |   });
  15  | 
  16  |   test("/movies — desktop chrome, header, desktop filter dropdowns", async ({ page }) => {
  17  |     await page.goto("/movies", { waitUntil: "networkidle" });
  18  | 
  19  |     await expect(page.locator('[data-tv-unified-ui="true"]')).toBeVisible();
  20  |     await expect(page.locator("header")).toBeVisible();
  21  |     await expect(page.locator("aside[aria-label='منوی اصلی']")).toHaveCount(0);
  22  |     await expect(page.getByRole("button", { name: "فیلترها", exact: true })).toHaveCount(0);
  23  |     await expect(page.getByRole("button", { name: "ژانر", exact: true })).toBeVisible();
  24  |     await expect(page.getByRole("button", { name: "امتیاز IMDB", exact: true })).toBeVisible();
  25  | 
  26  |     const grid = page.locator('[data-tv-grid="poster"]');
  27  |     const empty = page.getByText("هنوز موردی در این بخش منتشر نشده است");
  28  |     await expect(grid.or(empty)).toBeVisible();
  29  |   });
  30  | 
  31  |   test("/series — same unified catalog chrome", async ({ page }) => {
  32  |     await page.goto("/series", { waitUntil: "networkidle" });
  33  | 
  34  |     await expect(page.locator('[data-tv-unified-ui="true"]')).toBeVisible();
  35  |     await expect(page.locator("header")).toBeVisible();
  36  |     await expect(page.locator("aside[aria-label='منوی اصلی']")).toHaveCount(0);
  37  |     await expect(page.getByRole("button", { name: "ژانر", exact: true })).toBeVisible();
  38  | 
  39  |     const grid = page.locator('[data-tv-grid="poster"]');
  40  |     const empty = page.getByText("هنوز موردی در این بخش منتشر نشده است");
  41  |     await expect(grid.or(empty)).toBeVisible();
  42  |   });
  43  | 
  44  |   test("filter dropdown — genre panel opens as dialog on TV", async ({ page }) => {
  45  |     await page.goto("/movies", { waitUntil: "networkidle" });
  46  | 
  47  |     const genreTrigger = page.getByRole("button", { name: "ژانر", exact: true });
  48  |     await genreTrigger.click();
  49  | 
  50  |     const panel = page.getByRole("dialog", { name: "ژانر" });
  51  |     await expect(panel).toBeVisible();
  52  |     await expect(panel.locator("xpath=ancestor::body")).toHaveCount(1);
  53  | 
  54  |     await page.keyboard.press("Escape");
  55  |     await expect(panel).toHaveCount(0);
  56  |     await expect(genreTrigger).toBeFocused();
  57  |   });
  58  | 
  59  |   test("/movies — dub/subtitle badges stay at top of poster cards", async ({ page }) => {
  60  |     await page.goto("/movies", { waitUntil: "networkidle" });
  61  | 
  62  |     const badge = page.locator("[data-tv-poster-badge]").first();
  63  |     const hasBadge = (await badge.count()) > 0;
  64  |     test.skip(!hasBadge, "No dubbed/subtitle badges in catalog — seed content first");
  65  | 
  66  |     const placement = await badge.evaluate((node) => {
  67  |       const shell = node.closest("[data-tv-poster-shell]");
  68  |       if (!shell) {
  69  |         return null;
  70  |       }
  71  | 
  72  |       const shellRect = shell.getBoundingClientRect();
  73  |       const badgeRect = node.getBoundingClientRect();
  74  |       const badgeCenterY = badgeRect.top + badgeRect.height / 2;
  75  |       const shellMidY = shellRect.top + shellRect.height / 2;
  76  | 
  77  |       return {
  78  |         nearTop: badgeRect.top - shellRect.top < shellRect.height * 0.25,
  79  |         aboveMidline: badgeCenterY < shellMidY,
  80  |       };
  81  |     });
  82  | 
  83  |     expect(placement?.nearTop).toBe(true);
  84  |     expect(placement?.aboveMidline).toBe(true);
  85  |   });
  86  | 
  87  |   test("/login — TvLoginPanel shows activation code", async ({ page }) => {
  88  |     await page.route("**/api/v1/tv/activate/request", async (route) => {
  89  |       await route.fulfill({
  90  |         status: 200,
  91  |         contentType: "application/json",
  92  |         body: JSON.stringify({
  93  |           success: true,
  94  |           data: {
  95  |             code: "ABCD-1234",
  96  |             expires_at: new Date(Date.now() + 600_000).toISOString(),
  97  |             expires_in: 600,
  98  |             pair_url: "/tv-login",
  99  |           },
  100 |         }),
  101 |       });
  102 |     });
  103 |     await page.route("**/api/v1/tv/activate/poll*", async (route) => {
  104 |       await route.fulfill({
  105 |         status: 200,
  106 |         contentType: "application/json",
  107 |         body: JSON.stringify({
  108 |           success: true,
  109 |           data: { status: "pending", expires_at: new Date().toISOString() },
  110 |         }),
  111 |       });
  112 |     });
  113 | 
> 114 |     await page.goto("/login", { waitUntil: "networkidle" });
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  115 |     await expect(page.getByText("ABCD-1234")).toBeVisible({ timeout: 20_000 });
  116 |     await expect(page.getByText("ورود با گوگل")).toHaveCount(0);
  117 |   });
  118 | 
  119 |   test("/movies/[slug] — Play CTA, no YouTube iframe", async ({ page, request }) => {
  120 |     const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8005/api";
  121 |     const list = await request.get(`${apiBase}/movies?per_page=1`);
  122 |     expect(list.ok()).toBeTruthy();
  123 |     const json = (await list.json()) as { data?: { movies?: Array<{ slug: string }> } };
  124 |     const slug = json.data?.movies?.[0]?.slug;
  125 |     test.skip(!slug, "No published movies in API — seed catalog first");
  126 | 
  127 |     await page.goto(`/movies/${slug}`, { waitUntil: "networkidle" });
  128 |     await expect(page.locator('a[data-tv-focusable]').filter({ hasText: /تماشا/ })).toBeVisible();
  129 |     await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
  130 |   });
  131 | 
  132 |   test("/series/[slug] — episodes fetch only after tab activation", async ({ page, request }) => {
  133 |     const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8005/api";
  134 |     const list = await request.get(`${apiBase}/series?per_page=1`);
  135 |     expect(list.ok()).toBeTruthy();
  136 |     const json = (await list.json()) as { data?: { series?: Array<{ slug: string }> } };
  137 |     const slug = json.data?.series?.[0]?.slug;
  138 |     test.skip(!slug, "No published series in API — seed catalog first");
  139 | 
  140 |     const episodeRequests: string[] = [];
  141 |     page.on("request", (request) => {
  142 |       const url = request.url();
  143 |       if (/\/api\/series\/[^/]+\/episodes/.test(url)) {
  144 |         episodeRequests.push(url);
  145 |       }
  146 |     });
  147 | 
  148 |     await page.goto(`/series/${slug}`, { waitUntil: "networkidle" });
  149 |     await page.waitForTimeout(1500);
  150 |     expect(episodeRequests.length).toBe(0);
  151 | 
  152 |     await page.getByRole("tab", { name: "قسمت های سریال" }).click();
  153 |     await page.waitForTimeout(3000);
  154 |     expect(episodeRequests.length).toBeGreaterThan(0);
  155 |   });
  156 | });
  157 | 
```