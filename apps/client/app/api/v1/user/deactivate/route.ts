import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Deactivate user and all their schedules in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: auth.userId },
        data: { isActive: false },
      }),
      prisma.schedule.updateMany({
        where: { userId: auth.userId },
        data: { isActive: false },
      }),
    ]);

    // Clear auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("POST /api/user/deactivate error:", error);
    return NextResponse.json({ success: false, error: "Failed to deactivate account" }, { status: 500 });
  }
}
