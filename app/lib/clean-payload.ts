type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Recursively removes null, undefined, empty strings, and empty arrays/objects
 * to shrink admin form payloads before network submission.
 */
export function cleanPayload<T>(value: T): T {
  if (value === null || value === undefined) {
    return undefined as T;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    return (trimmed === "" ? undefined : trimmed) as T;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => cleanPayload(item))
      .filter((item) => item !== undefined);

    return (cleaned.length === 0 ? undefined : cleaned) as T;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => [key, cleanPayload(nested)] as const)
      .filter(([, nested]) => nested !== undefined);

    if (entries.length === 0) {
      return undefined as T;
    }

    return Object.fromEntries(entries) as T;
  }

  return value;
}

export function payloadByteSize(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return JSON.stringify(value).length;
  }
}

export function logPayloadSize(label: string, before: unknown, after: unknown): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const beforeBytes = payloadByteSize(before);
  const afterBytes = payloadByteSize(after);
  const reduction =
    beforeBytes > 0 ? Math.round(((beforeBytes - afterBytes) / beforeBytes) * 100) : 0;

  console.info(
    `[cleanPayload] ${label}: ${beforeBytes}B → ${afterBytes}B (${reduction}% reduction)`,
  );
}
