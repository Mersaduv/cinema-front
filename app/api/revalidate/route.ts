import { NextRequest, NextResponse } from "next/server";
import { invalidatePublicViewerCache } from "../../lib/catalog/invalidate-public-cache";

type RevalidateRequestBody = {
  secret?: string;
  tags?: string[];
  paths?: string[];
  mode?: "immediate" | "stale-while-revalidate";
};

function resolveRevalidationSecret(): string | null {
  const secret =
    process.env.NEXT_REVALIDATION_SECRET?.trim() ||
    process.env.REVALIDATION_SECRET?.trim() ||
    "";

  return secret !== "" ? secret : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const configuredSecret = resolveRevalidationSecret();

  if (!configuredSecret) {
    return NextResponse.json(
      {
        revalidated: false,
        message: "Revalidation secret is not configured on the frontend.",
      },
      { status: 503 },
    );
  }

  let body: RevalidateRequestBody = {};

  try {
    body = (await request.json()) as RevalidateRequestBody;
  } catch {
    return NextResponse.json(
      { revalidated: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (body.secret !== configuredSecret) {
    return NextResponse.json(
      { revalidated: false, message: "Invalid revalidation secret." },
      { status: 401 },
    );
  }

  const result = invalidatePublicViewerCache({
    tags: body.tags,
    paths: body.paths,
    mode: body.mode ?? "immediate",
  });

  return NextResponse.json({
    revalidated: true,
    tags: result.tags,
    paths: result.paths,
    now: Date.now(),
  });
}
