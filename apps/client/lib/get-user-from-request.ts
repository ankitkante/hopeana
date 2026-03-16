import { NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "./auth";
import { prisma } from "db";

export async function getUserFromRequest(request: NextRequest) {
  let payload: Awaited<ReturnType<typeof verifyToken>> = null;

  // First try middleware-injected headers (skips cookie parsing)
  const headerUserId = request.headers.get("x-user-id");
  const headerEmail = request.headers.get("x-user-email");
  const headerTokenVersion = request.headers.get("x-token-version");
  if (headerUserId && headerEmail) {
    payload = {
      userId: headerUserId,
      email: headerEmail,
      tokenVersion: headerTokenVersion ? parseInt(headerTokenVersion, 10) : 0,
    };
  } else {
    // Fallback: verify cookie directly
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    payload = await verifyToken(token);
  }

  if (!payload) return null;

  // DB check: verify user still exists, is active, and tokenVersion matches.
  // This invalidates JWTs for deleted/deactivated users and after password changes.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, isActive: true, tokenVersion: true },
  });

  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    return null;
  }

  return { userId: user.id, email: user.email };
}
