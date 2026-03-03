import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { createLogger } from "utils";

const logger = createLogger("api:auth:verify-email");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || "");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, emailVerifiedAt: true, isActive: true } } },
    });

    if (
      !verificationToken ||
      verificationToken.usedAt !== null ||
      verificationToken.expiresAt < new Date() ||
      !verificationToken.user.isActive
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification link" },
        { status: 400 },
      );
    }

    // Already verified — mark token used and return success (idempotent)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: verificationToken.user.emailVerifiedAt ?? new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    logger.info("Email verified", { userId: verificationToken.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("POST /api/v1/auth/verify-email error", { error });
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
