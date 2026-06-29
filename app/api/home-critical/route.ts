import { NextResponse } from "next/server";
import { getCachedCriticalHomePayload } from "../../lib/catalog/home-critical";

export async function GET() {
  const payload = await getCachedCriticalHomePayload();

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
