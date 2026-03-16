import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "db";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import { createLogger } from "utils";

const logger = createLogger("api:auth:login");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      select: { id: true, email: true, passwordHash: true, isActive: true, tokenVersion: true },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({ success: true, data: { userId: user.id, email: user.email } });
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions(60 * 60 * 24 * 7));
    return response;
  } catch (error) {
    logger.error("POST /api/v1/auth/login error", { error });
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
