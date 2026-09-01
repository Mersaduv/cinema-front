type Bucket = {
  count: number;
  resetAt: number;
};

// In-memory rate limiter for basic bot/burst protection on Next.js proxy routes.
// Works best on a single instance (common for your Windows server setup).
const buckets = new Map<string, Bucket>();

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (existing.count >= limit) {
    return true;
  }

  existing.count += 1;
  return false;
}

