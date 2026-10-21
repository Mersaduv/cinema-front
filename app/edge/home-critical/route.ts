import { NextResponse } from "next/server";
import { getCachedCriticalHomePayload } from "../../lib/catalog/home-critical";

export async function GET() {
  const payload = await getCachedCriticalHomePayload();

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
