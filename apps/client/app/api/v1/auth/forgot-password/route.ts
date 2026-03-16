import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { generateToken, sendPasswordResetEmail } from "@/lib/auth-tokens";
import { createLogger } from "utils";

const logger = createLogger("api:auth:forgot-password");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, isActive: true, passwordHash: true },
    });

    if (user && user.isActive) {
      const rawToken = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token: rawToken, expiresAt },
      });

      await sendPasswordResetEmail(email, user.firstName, rawToken);
      logger.info("Password reset email sent", { userId: user.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("POST /api/v1/auth/forgot-password error", { error });
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 500 });
  }
}
