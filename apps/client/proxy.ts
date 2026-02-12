import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = isApiRoute
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  // Attach userId and email to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-email", payload.email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/user/:path*",
    "/api/subscription/:path*",
    "/api/schedules/:path*",
    "/api/messages/:path*",
    "/api/quotes/:path*",
  ],
};
