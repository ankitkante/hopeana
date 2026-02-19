import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { getUserFromRequest } from "@/lib/get-user-from-request";

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: auth.userId },
    });

    if (!subscription) {
      // Fallback for users created before Subscription model existed
      return NextResponse.json({
        success: true,
        data: {
          plan: "free",
          status: "active",
          messageLimit: 5,
          messagesUsed: 0,
          messagesRemaining: 5,
          billingDate: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: subscription.plan,
        status: subscription.status,
        messageLimit: subscription.messageLimit,
        messagesUsed: subscription.messagesUsed,
        messagesRemaining: subscription.messageLimit - subscription.messagesUsed,
        billingDate: subscription.billingDate,
      },
    });
  } catch (error) {
    console.error("GET /api/subscription error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch subscription" }, { status: 500 });
  }
}
