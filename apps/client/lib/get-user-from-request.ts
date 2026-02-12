import { NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "./auth";

export async function getUserFromRequest(request: NextRequest) {
  // First try middleware-injected headers
  const headerUserId = request.headers.get("x-user-id");
  const headerEmail = request.headers.get("x-user-email");
  if (headerUserId && headerEmail) {
    return { userId: headerUserId, email: headerEmail };
  }

  // Fallback: verify cookie directly
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
