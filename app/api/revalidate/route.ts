import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    secret?: string;
    path?: string;
    tag?: string;
  };

  if (body.secret !== process.env.NEXT_REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.tag) {
    revalidateTag(body.tag, { expire: 0 });
  }

  if (body.path) {
    revalidatePath(body.path);
  }

  return NextResponse.json({ revalidated: true });
}
