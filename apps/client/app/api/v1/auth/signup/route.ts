import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "db";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import { generateToken, sendVerificationEmail } from "@/lib/auth-tokens";
import { createLogger } from "utils";

const logger = createLogger("api:auth:signup");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const { user, verificationToken } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          firstName: firstName ? String(firstName).trim() : null,
          lastName: lastName ? String(lastName).trim() : null,
          passwordHash,
          provider: "email",
        },
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          plan: "free",
          status: "active",
          messageLimit: 5,
          messagesUsed: 0,
        },
      });

      const rawToken = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await tx.emailVerificationToken.create({
        data: { userId: user.id, token: rawToken, expiresAt },
      });

      return { user, verificationToken: rawToken };
    });

    // Send verification email after transaction (failure doesn't roll back account creation)
    await sendVerificationEmail(user.email, user.firstName, verificationToken);

    const token = await signToken({
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    logger.info("User signed up", { userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { userId: user.id, email: user.email },
    });
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions(60 * 60 * 24 * 7));
    return response;
  } catch (error) {
    logger.error("POST /api/v1/auth/signup error", { error });
    return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
  }
}
