const DEFAULT_API_URL = "http://localhost:8005/api";
const DEFAULT_CDN_ORIGIN = "https://cdn.cinema.af";

function parseOrigin(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

export function getResourceHintOrigins(): string[] {
  const origins = new Set<string>();

  const apiOrigin = parseOrigin(
    process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
  );
  if (apiOrigin) {
    origins.add(apiOrigin);
  }

  const cdnOrigin = parseOrigin(
    process.env.NEXT_PUBLIC_CDN_ORIGIN ?? DEFAULT_CDN_ORIGIN,
  );
  if (cdnOrigin) {
    origins.add(cdnOrigin);
  }

  const imageHost = process.env.NEXT_PUBLIC_CINEMA_IMAGE_HOST?.trim();
  if (imageHost) {
    origins.add(`https://${imageHost}`);
    origins.add(`http://${imageHost}`);
  }

  return [...origins];
}
