export function extractYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.includes("youtube.com")) {
      const fromQuery = parsed.searchParams.get("v");
      if (fromQuery) {
        return fromQuery;
      }

      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) {
        return embedMatch[1];
      }

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) {
        return shortsMatch[1];
      }
    }
  } catch {
    // Fall through to regex for non-absolute URLs.
  }

  const regexMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{6,})/,
  );

  return regexMatch?.[1] ?? null;
}
