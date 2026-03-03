import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";
import { generateToken, sendVerificationEmail } from "@/lib/auth-tokens";
import { createLogger } from "utils";

const logger = createLogger("api:auth:resend-verification");

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, firstName: true, emailVerifiedAt: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.emailVerifiedAt !== null) {
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 409 },
      );
    }

    // Rate limit: one resend per 60 seconds
    const recentToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });

    if (recentToken) {
      return NextResponse.json(
        { success: false, error: "Please wait before requesting another email" },
        { status: 429 },
      );
    }

    const rawToken = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token: rawToken, expiresAt },
    });

    await sendVerificationEmail(user.email, user.firstName, rawToken);

    logger.info("Verification email resent", { userId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("POST /api/v1/auth/resend-verification error", { error });
    return NextResponse.json({ success: false, error: "Failed to resend verification email" }, { status: 500 });
  }
}
