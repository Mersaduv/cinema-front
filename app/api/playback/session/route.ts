import { isRateLimited } from "../../../lib/simple-rate-limit";

const API_BASE =
  process.env.NEXT_PUBLIC_CINEMA_API_URL?.replace(/\/$/, "") ?? "";

export async function GET(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : "unknown";
  if (isRateLimited(`playback-session:${ip}`, 40, 60_000)) {
    return Response.json(
      { success: false, message: "Too many requests" },
      { status: 429 },
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(`${API_BASE}/api/v1/playback/session`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "Playback session proxy failed." },
      { status: 502 },
    );
  }
}
