import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";
import { createLogger } from "utils";

const logger = createLogger('api:quotes');

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const quotes = await prisma.$queryRaw<
      Array<{ id: string; content: string; author: string | null; category: string | null }>
    >`SELECT id, content, author, category FROM "QuotesBank" WHERE "isActive" = true ORDER BY RANDOM() LIMIT 1`;

    const quote = quotes[0] || null;

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    logger.error("GET /api/quotes/random error", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch random quote" },
      { status: 500 }
    );
  }
}
