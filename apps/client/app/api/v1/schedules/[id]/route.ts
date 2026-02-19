import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const schedule = await prisma.schedule.findFirst({
      where: { id, userId: auth.userId },
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
    });

    if (!schedule) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error("GET /api/schedules/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const schedule = await prisma.schedule.findFirst({
      where: { id, userId: auth.userId },
    });
    if (!schedule) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    const body = await request.json();
    const { channel, frequency, timeOfDay, daysOfWeek, intervalValue, intervalUnit, timezone } = body;

    if (!channel || !frequency || !timeOfDay) {
      return NextResponse.json({ success: false, error: "channel, frequency, and timeOfDay are required" }, { status: 400 });
    }

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ success: false, error: "At least one day must be selected" }, { status: 400 });
    }

    if (frequency === "custom_interval" && (!intervalValue || !intervalUnit)) {
      return NextResponse.json({ success: false, error: "intervalValue and intervalUnit are required for custom intervals" }, { status: 400 });
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        channel,
        frequency,
        timeOfDay,
        timezone: timezone || schedule.timezone,
        daysOfWeek,
        intervalValue: frequency === "custom_interval" ? parseInt(intervalValue) : null,
        intervalUnit: frequency === "custom_interval" ? intervalUnit : null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/schedules/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update schedule" }, { status: 500 });
  }
}
