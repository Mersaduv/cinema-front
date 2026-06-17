const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

export type TvActivationRequest = {
  code: string;
  expires_at: string;
  expires_in: number;
  pair_url: string;
};

export type TvActivationPoll =
  | { status: "pending"; expires_at: string }
  | { status: "activated"; token?: string; user?: unknown }
  | { status: "expired" | "not_found" };

export async function requestTvActivationCode(deviceLabel?: string): Promise<TvActivationRequest> {
  const response = await fetch(`${API_BASE}/v1/tv/activate/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ device_label: deviceLabel ?? "tv-browser" }),
  });

  const payload = (await response.json()) as {
    success: boolean;
    data?: TvActivationRequest;
    message?: string;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message ?? "دریافت کد فعال‌سازی ناموفق بود.");
  }

  return payload.data;
}

export async function pollTvActivation(code: string): Promise<TvActivationPoll> {
  const response = await fetch(
    `${API_BASE}/v1/tv/activate/poll?code=${encodeURIComponent(code)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as {
    success: boolean;
    data?: TvActivationPoll;
  };

  if (!response.ok || !payload.success || !payload.data) {
    return { status: "not_found" };
  }

  return payload.data;
}

export async function confirmTvActivation(code: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/v1/tv/activate/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  const payload = (await response.json()) as { success: boolean; message?: string };

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "تأیید کد ناموفق بود.");
  }
}
