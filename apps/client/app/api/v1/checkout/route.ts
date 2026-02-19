// apps/client/app/api/v1/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Checkout } from "@dodopayments/nextjs";
import { getUserFromRequest } from "@/lib/get-user-from-request";
import { prisma } from "db";

const checkoutHandler = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode" | undefined,
  type: "static",
});

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const productId =
    process.env.DODO_PRO_PRODUCT_ID ||
    process.env.NEXT_PUBLIC_DODO_PRO_PRODUCT_ID;

  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Checkout is not configured (product id missing)" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  for (const key of Array.from(url.searchParams.keys())) {
    url.searchParams.delete(key);
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { firstName: true, lastName: true },
  });

  // Unique per-attempt id — passed to Dodo as metadata so the webhook can
  // find the exact placeholder via findUnique("pending_${correlationId}").
  const correlationId = randomUUID();

  try {
    await prisma.payment.create({
      data: {
        userId: auth.userId,
        gatewayPaymentId: `pending_${correlationId}`,
        customerEmail: auth.email,
        amount: 0,
        currency: "",
        status: "pending",
        rawPayload: "{}",
      },
    });
  } catch (err) {
    // Don't block checkout — webhook fallback will still record the payment.
    console.error("[Checkout] Failed to create pending placeholder:", err);
  }

  url.searchParams.set("productId", productId);
  url.searchParams.set("quantity", "1");
  url.searchParams.set("email", auth.email);
  if (user?.firstName || user?.lastName)
    url.searchParams.set("fullName", [user?.firstName, user?.lastName].filter(Boolean).join(" "));
  if (user?.firstName) url.searchParams.set("firstName", user.firstName);
  if (user?.lastName) url.searchParams.set("lastName", user.lastName);
  url.searchParams.set("metadata_correlation_id", correlationId);

  const enrichedRequest = new NextRequest(url, {
    method: request.method,
    headers: request.headers,
  });

  return checkoutHandler(enrichedRequest);
}
