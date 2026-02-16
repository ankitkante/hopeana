import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName } = body;

    if (firstName !== undefined && (typeof firstName !== "string" || firstName.length > 50)) {
      return NextResponse.json({ error: "First name must be a string under 50 characters" }, { status: 400 });
    }
    if (lastName !== undefined && (typeof lastName !== "string" || lastName.length > 50)) {
      return NextResponse.json({ error: "Last name must be a string under 50 characters" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("PATCH /api/user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
