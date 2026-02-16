import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "5", 10)));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.sentMessage.findMany({
        where: { userId: auth.userId },
        include: {
          quote: {
            select: { content: true, author: true },
          },
        },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sentMessage.count({ where: { userId: auth.userId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((m) => ({
          id: m.id,
          sentAt: m.sentAt,
          channel: m.channel,
          status: m.status,
          quote: {
            content: m.quote.content,
            author: m.quote.author,
          },
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
