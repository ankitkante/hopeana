import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await prisma.schedule.findMany({
      where: { userId: auth.userId },
      select: {
        id: true,
        channel: true,
        frequency: true,
        timeOfDay: true,
        timezone: true,
        daysOfWeek: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const activeCount = schedules.filter((s) => s.isActive).length;
    const newThisWeek = schedules.filter(
      (s) => new Date(s.createdAt) >= oneWeekAgo
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        schedules,
        count: schedules.length,
        activeCount,
        newThisWeek,
      },
    });
  } catch (error) {
    console.error("GET /api/schedules error:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}
