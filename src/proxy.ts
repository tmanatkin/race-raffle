import { NextRequest, NextResponse } from "next/server";
import { Role, SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";

function roleForPath(pathname: string): Role | null {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return "admin";
  }
  if (pathname.startsWith("/volunteer") || pathname.startsWith("/api/volunteer")) {
    return "volunteer";
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiredRole = roleForPath(pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const session = await verifySessionCookieValue(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isAuthorized =
    session?.role === requiredRole || (requiredRole === "volunteer" && session?.role === "admin");

  if (isAuthorized) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("role", requiredRole);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/volunteer/:path*", "/api/admin/:path*", "/api/volunteer/:path*"],
};
