import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";
import { createLogger } from "utils";

const logger = createLogger('api:messages:stats');

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const [totalSent, successfulSent, sentThisMonth, sentLastMonth] =
      await Promise.all([
        prisma.sentMessage.count({ where: { userId: auth.userId } }),
        prisma.sentMessage.count({
          where: { userId: auth.userId, status: "sent" },
        }),
        prisma.sentMessage.count({
          where: {
            userId: auth.userId,
            sentAt: { gte: startOfMonth },
            status: "sent",
          },
        }),
        prisma.sentMessage.count({
          where: {
            userId: auth.userId,
            sentAt: { gte: startOfLastMonth, lt: startOfMonth },
            status: "sent",
          },
        }),
      ]);

    const successRate =
      totalSent > 0 ? Math.round((successfulSent / totalSent) * 100) : 100;
    const monthOverMonthChange =
      sentLastMonth > 0
        ? Math.round(((sentThisMonth - sentLastMonth) / sentLastMonth) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalSent,
        successRate,
        sentThisMonth,
        sentLastMonth,
        monthOverMonthChange,
      },
    });
  } catch (error) {
    logger.error("GET /api/messages/stats error", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch message stats" },
      { status: 500 }
    );
  }
}
