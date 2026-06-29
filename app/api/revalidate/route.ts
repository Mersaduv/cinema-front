import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { VIEWER_CACHE_TAGS } from "../../lib/catalog/cache-tags";
type RevalidateBody = {
  secret?: string;
  path?: string;
  tag?: string;
  tags?: string[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RevalidateBody;

  if (body.secret !== process.env.NEXT_REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = [
    ...(body.tags ?? []),
    ...(body.tag ? [body.tag] : []),
  ].filter((tag) => tag.trim().length > 0);

  const uniqueTags = [...new Set(tags)];

  for (const tag of uniqueTags) {
    revalidateTag(tag, "max");
  }

  if (uniqueTags.length === 0) {
    for (const tag of VIEWER_CACHE_TAGS) {
      revalidateTag(tag, "max");
    }
  }

  if (body.path) {
    revalidatePath(body.path);
  }

  return NextResponse.json({ revalidated: true, tags: uniqueTags });
}
