import { NextRequest, NextResponse } from "next/server";
import { prisma } from "db";
import { PaymentStatus } from "@prisma/client";
import { getUserFromRequest } from "@/lib/get-user-from-request";

// GET /api/payments
// Returns payment records for the authenticated user, ordered by most recent first.
//
// Query params:
//   status        — filter by payment status (e.g. "succeeded", "failed", "pending")
//   customerEmail — filter by customer email; must match the authenticated user's email
//   limit         — max results per page (default: 20, max: 100)
//   page          — 1-indexed page number (default: 1)
//
// Response:
//   {
//     success: true,
//     data: {
//       payments: Payment[],
//       total: number,
//       page: number,
//       limit: number,
//     }
//   }
export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // PAYMENT_DISABLED
  return NextResponse.json({}, { status: 404 });

  const { searchParams } = new URL(request.url);

  const statusParam = searchParams.get("status");
  const status = statusParam && Object.values(PaymentStatus).includes(statusParam as PaymentStatus)
    ? (statusParam as PaymentStatus)
    : undefined;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const offset = (page - 1) * limit;

  // customerEmail param is supported for flexibility but must match the session email
  // to prevent querying another user's payment records.
  const requestedEmail = searchParams.get("customerEmail");
  // @ts-expect-error dead code — auth narrowing lost after return
  const customerEmail = (requestedEmail && requestedEmail === auth.email ? requestedEmail : auth.email) || "";

  // Filter by userId OR customerEmail to catch records where userId may be null
  // (can happen when the webhook fires before the user is matched by email).
  const where = {
    OR: [
      // @ts-expect-error dead code — auth narrowing lost after return
      { userId: auth.userId },
      { customerEmail },
    ],
    ...(status ? { status } : {}),
  };

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        gatewayPaymentId: true,
        gatewaySubscriptionId: true,
        status: true,
        amount: true,
        currency: true,
        failureReason: true,
        customerEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      payments,
      total,
      page,
      limit,
    },
  });
}
