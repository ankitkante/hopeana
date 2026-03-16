import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Best-effort tokenVersion increment — invalidates all existing sessions for this user.
  // If auth check fails (already expired token), we still clear the cookie.
  const auth = await getUserFromRequest(request);
  if (auth) {
    await prisma.user.update({
      where: { id: auth.userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", authCookieOptions(0));
  return response;
}
