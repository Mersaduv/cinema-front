import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function normalizeSubtitleBody(body: string) {
  const cleaned = body.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

  if (cleaned.startsWith("WEBVTT")) {
    return cleaned;
  }

  return `WEBVTT\n\n${cleaned.replace(/^\s+/, "")}`;
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("src")?.trim();

  if (!source) {
    return new Response("Missing subtitle source.", { status: 400 });
  }

  if (!/^https?:\/\//i.test(source)) {
    return new Response("Unsupported subtitle source.", { status: 400 });
  }

  try {
    const response = await fetch(source, {
      headers: {
        Accept: "text/vtt, text/plain;q=0.9, */*;q=0.5",
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response("Subtitle source is unavailable.", { status: 502 });
    }

    const subtitleBody = normalizeSubtitleBody(await response.text());

    return new Response(subtitleBody, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch {
    return new Response("Subtitle source could not be loaded.", { status: 502 });
  }
}
