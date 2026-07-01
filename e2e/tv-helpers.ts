import type { Page } from "@playwright/test";

export const TIZEN_UA =
  "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/56.0.2987.98 TV Safari/537.36";

export const WEBOS_UA =
  "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager";

export async function installTvUserAgent(page: Page, userAgent: string): Promise<void> {
  await page.addInitScript((ua) => {
    Object.defineProperty(navigator, "userAgent", {
      get: () => ua,
      configurable: true,
    });
  }, userAgent);
}

export async function installTvCompat(page: Page): Promise<void> {
  await page.addInitScript(() => {
    document.documentElement.setAttribute("data-tv-compat", "true");
  });
}

export async function pressTvBack(page: Page): Promise<void> {
  await page.keyboard.press("BrowserBack");
}

export function createConsoleCollector(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    errors.push(err.message);
  });
  return errors;
}

export const MINIMAL_HLS_MANIFEST = [
  "#EXTM3U",
  "#EXT-X-VERSION:3",
  "#EXT-X-TARGETDURATION:10",
  "#EXTINF:10.0,",
  "https://cdn.example.com/seg0.ts",
  "#EXT-X-ENDLIST",
].join("\n");

export async function mockPlaybackManifest(page: Page): Promise<void> {
  await page.route("**/api/playback/manifest**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/vnd.apple.mpegurl",
      body: MINIMAL_HLS_MANIFEST,
    });
  });

  await page.route("**/seg0.ts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "video/mp2t",
      body: Buffer.alloc(188),
    });
  });
}
