import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  STAFF_ACCESS_COOKIE,
  STAFF_ACCESS_COOKIE_VALUE,
} from "./app/lib/staff-access";

export function middleware(request: NextRequest) {
  const hasStaffAccess =
    request.cookies.get(STAFF_ACCESS_COOKIE)?.value ===
    STAFF_ACCESS_COOKIE_VALUE;

  if (!hasStaffAccess) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/adminbod";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
