import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "db";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import { createLogger } from "utils";

const logger = createLogger("api:auth:reset-password");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 },
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: String(token) },
      include: { user: { select: { id: true, email: true, isActive: true } } },
    });

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < new Date() ||
      !resetToken.user.isActive
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
        select: { id: true, email: true, tokenVersion: true },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    logger.info("Password reset completed", { userId: updatedUser.id });

    const jwtToken = await signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, jwtToken, authCookieOptions(60 * 60 * 24 * 7));
    return response;
  } catch (error) {
    logger.error("POST /api/v1/auth/reset-password error", { error });
    return NextResponse.json({ success: false, error: "Password reset failed" }, { status: 500 });
  }
}
