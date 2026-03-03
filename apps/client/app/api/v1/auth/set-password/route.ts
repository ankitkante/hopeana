import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "db";
import { getUserFromRequest, } from "@/lib/get-user-from-request";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import { createLogger } from "utils";

const logger = createLogger("api:auth:set-password");

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password || String(password).length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, passwordHash: true, tokenVersion: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.passwordHash !== null) {
      return NextResponse.json(
        { success: false, error: "Password already set. Use the reset password flow to change it." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { id: true, email: true, tokenVersion: true },
    });

    logger.info("Password set for first time", { userId: updatedUser.id });

    const jwtToken = await signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, jwtToken, authCookieOptions(60 * 60 * 24 * 7));
    return response;
  } catch (error) {
    logger.error("POST /api/v1/auth/set-password error", { error });
    return NextResponse.json({ success: false, error: "Failed to set password" }, { status: 500 });
  }
}
