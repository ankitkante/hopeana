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
        intervalValue: true,
        intervalUnit: true,
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

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduleId, isActive } = await request.json();
    if (!scheduleId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "scheduleId and isActive are required" }, { status: 400 });
    }

    const schedule = await prisma.schedule.findFirst({
      where: { id: scheduleId, userId: auth.userId },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isActive },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/schedules error:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduleId } = await request.json();
    if (!scheduleId) {
      return NextResponse.json({ error: "scheduleId is required" }, { status: 400 });
    }

    const schedule = await prisma.schedule.findFirst({
      where: { id: scheduleId, userId: auth.userId },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    await prisma.schedule.delete({ where: { id: scheduleId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/schedules error:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
