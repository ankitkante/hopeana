// apps/client/app/api/webhook/dodo-payments/route.ts
import { Webhooks } from "@dodopayments/nextjs";
import { prisma } from "db";

/**
 * Dodo Payments verified webhook handler.
 *
 * Configure this URL in the Dashboard (Test Mode for sandbox, Live Mode for prod):
 *   https://your-domain.com/api/webhook/dodo-payments
 *
 * Events to enable:
 *   - subscription.active, subscription.renewed, subscription.cancelled, subscription.failed
 *   - payment.succeeded, payment.failed
 *
 * Env (server-only): DODO_PAYMENTS_WEBHOOK_SECRET=whsec_XXXXXXXX
 *
 * IMPORTANT: payload.data is the entity itself (flat), NOT payload.data.subscription.
 * Access fields as payload.data.subscription_id, payload.data.customer.email, etc.
 */

/** Extract and validate customer email from webhook payload. Throws if missing. */
function requireEmail(data: { customer?: { email?: string } }, eventType: string): string {
  const email = data?.customer?.email;
  if (!email) {
    console.error(`[Dodo Webhook] Missing customer email in ${eventType} payload`);
    throw new Error(`Missing customer email in ${eventType}`);
  }
  return email;
}

/** Find local user by email. Returns null and logs if not found. */
async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.warn("[Dodo Webhook] No local user for email:", email);
  } else {
    console.log("[Dodo Webhook] Matched user:", user.id, "for email:", email);
  }
  return user;
}

/**
 * Activate a Pro subscription. Idempotent:
 * - create: sets messagesUsed=0 (new subscription)
 * - update: preserves messagesUsed (retry-safe), only resets on renewal
 */
async function activateProSubscription(email: string, gatewaySubscriptionId?: string, nextBillingDate?: Date | null) {
  const user = await findUserByEmail(email);
  if (!user) return;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: "pro",
      status: "active",
      messageLimit: 30,
      messagesUsed: 0,
      gatewaySubscriptionId: gatewaySubscriptionId || null,
      billingDate: nextBillingDate ?? null,
    },
    update: {
      plan: "pro",
      status: "active",
      messageLimit: 30,
      gatewaySubscriptionId: gatewaySubscriptionId || undefined,
      billingDate: nextBillingDate ?? undefined,
    },
  });
  console.log("[Dodo Webhook] Subscription upgraded to Pro for user:", user.id);
}

/**
 * Renew a Pro subscription. Resets messagesUsed to 0 for the new billing cycle.
 */
async function renewProSubscription(email: string, gatewaySubscriptionId?: string, nextBillingDate?: Date | null) {
  const user = await findUserByEmail(email);
  if (!user) return;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: "pro",
      status: "active",
      messageLimit: 30,
      messagesUsed: 0,
      gatewaySubscriptionId: gatewaySubscriptionId || null,
      billingDate: nextBillingDate ?? null,
    },
    update: {
      plan: "pro",
      status: "active",
      messageLimit: 30,
      messagesUsed: 0,
      gatewaySubscriptionId: gatewaySubscriptionId || undefined,
      billingDate: nextBillingDate ?? undefined,
    },
  });
  console.log("[Dodo Webhook] Subscription renewed (usage reset to 0) for user:", user.id);
}

/** Update subscription status (cancelled, failed, etc.). No-op if no subscription row exists. */
async function setSubscriptionStatus(email: string, status: "cancelled" | "failed" | "expired") {
  const user = await findUserByEmail(email);
  if (!user) return;

  try {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status, cancelAtPeriodEnd: false },
    });
    console.log("[Dodo Webhook] Subscription status →", status, "for user:", user.id);
  } catch {
    console.warn("[Dodo Webhook] No existing subscription row to update for status", status, "user:", user.id);
  }
}

/**
 * Handle cancellation that takes effect at the end of the billing period.
 * Keeps status "active" but flags cancelAtPeriodEnd so the UI can show a notice.
 * The actual downgrade happens when onSubscriptionExpired fires.
 */
async function markCancelAtPeriodEnd(email: string, billingDate?: Date | null) {
  const user = await findUserByEmail(email);
  if (!user) return;

  try {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        cancelAtPeriodEnd: true,
        billingDate: billingDate ?? undefined,
      },
    });
    console.log("[Dodo Webhook] cancelAtPeriodEnd set for user:", user.id);
  } catch {
    console.warn("[Dodo Webhook] No existing subscription row for cancelAtPeriodEnd, user:", user.id);
  }
}

/** Upsert a Payment record.
 *
 * On first delivery: uses correlationId (from Dodo metadata) to find the exact
 * per-attempt placeholder via findUnique("pending_${correlationId}") and updates
 * it in-place — the placeholder becomes the real payment record.
 *
 * On retry (placeholder already updated) or missing correlationId: falls back to
 * upsert by the real gatewayPaymentId for idempotency.
 */
async function upsertPayment(opts: {
  gatewayPaymentId: string;
  gatewaySubscriptionId?: string;
  gatewayCustomerId?: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: string;
  failureReason?: string;
  rawPayload: string;
  correlationId?: string;
}) {
  const user = await findUserByEmail(opts.customerEmail);

  const paymentData = {
    userId: user?.id || null,
    gatewayPaymentId: opts.gatewayPaymentId,
    gatewaySubscriptionId: opts.gatewaySubscriptionId || null,
    gatewayCustomerId: opts.gatewayCustomerId || null,
    customerEmail: opts.customerEmail,
    amount: opts.amount,
    currency: opts.currency,
    status: opts.status,
    failureReason: opts.failureReason || null,
    rawPayload: opts.rawPayload,
  };

  // First delivery: find the exact per-attempt placeholder by correlationId and update it.
  if (opts.correlationId) {
    const placeholder = await prisma.payment.findUnique({
      where: { gatewayPaymentId: `pending_${opts.correlationId}` },
    });

    if (placeholder) {
      await prisma.payment.update({
        where: { id: placeholder.id },
        data: paymentData,
      });
      console.log("[Dodo Webhook] Placeholder updated → real payment:", opts.gatewayPaymentId, "status:", opts.status, "user:", user?.id ?? "unknown");
      return;
    }
  }

  // Retry or no correlationId: upsert by real gatewayPaymentId for idempotency.
  await prisma.payment.upsert({
    where: { gatewayPaymentId: opts.gatewayPaymentId },
    create: paymentData,
    update: {
      status: opts.status,
      failureReason: opts.failureReason || null,
      rawPayload: opts.rawPayload,
      userId: user?.id ?? undefined,
    },
  });
  console.log("[Dodo Webhook] Payment upserted (retry/no-correlation):", opts.gatewayPaymentId, "status:", opts.status, "user:", user?.id ?? "unknown");
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,

  onPayload: async (payload) => {
    console.log("[Dodo Webhook] event:", payload.type);
  },

  // ── Payment events ──

  onPaymentSucceeded: async (payload) => {
    try {
      const data = payload.data;
      console.log("[Dodo Webhook] Processing payment.succeeded:", data.payment_id);
      const email = requireEmail(data, "payment.succeeded");

      if (!data?.payment_id) {
        console.error("[Dodo Webhook] payment.succeeded missing payment_id");
        throw new Error("payment.succeeded missing payment_id");
      }

      const correlationId = (data as { metadata?: { correlation_id?: string } }).metadata?.correlation_id;

      await upsertPayment({
        gatewayPaymentId: data.payment_id,
        gatewaySubscriptionId: data.subscription_id ?? undefined,
        gatewayCustomerId: data.customer?.customer_id,
        customerEmail: email,
        amount: data.total_amount ?? 0,
        currency: data.currency ?? "USD",
        status: "succeeded",
        rawPayload: JSON.stringify(payload),
        correlationId,
      });

      console.log("[Dodo Webhook] payment.succeeded:", data.payment_id, "email:", email);
    } catch (err) {
      console.error("[Dodo Webhook] payment.succeeded handler error:", err);
      throw err;
    }
  },

  onPaymentFailed: async (payload) => {
    try {
      const data = payload.data;
      console.log("[Dodo Webhook] Processing payment.failed:", data.payment_id);
      const email = requireEmail(data, "payment.failed");

      if (!data?.payment_id) {
        console.error("[Dodo Webhook] payment.failed missing payment_id");
        throw new Error("payment.failed missing payment_id");
      }

      // Narrow failure fields without using `any`
      type FailureLike = {
        error_message?: string;
        last_error_message?: string;
        error_code?: string;
        last_error_code?: string;
        error?: { message?: string; code?: string };
        processor_response?: { message?: string; code?: string };
      };
      const d = data as FailureLike;

      const errorMessage: string | undefined =
        d.error_message ??
        d.last_error_message ??
        d.error?.message ??
        d.processor_response?.message;

      const errorCode: string | undefined =
        d.error_code ??
        d.last_error_code ??
        d.error?.code ??
        d.processor_response?.code;

      let failureReason: string | undefined =
        errorMessage && errorCode ? `${errorMessage} (code: ${errorCode})`
        : errorMessage ?? errorCode ?? `Payment failed for ${email}`;

      if (failureReason && failureReason.length > 512) {
        failureReason = failureReason.slice(0, 512);
      }

      const correlationId = (data as { metadata?: { correlation_id?: string } }).metadata?.correlation_id;

      await upsertPayment({
        gatewayPaymentId: data.payment_id,
        gatewaySubscriptionId: data.subscription_id ?? undefined,
        gatewayCustomerId: data.customer?.customer_id,
        customerEmail: email,
        amount: data.total_amount ?? 0,
        currency: data.currency ?? "USD",
        status: "failed",
        failureReason,
        rawPayload: JSON.stringify(payload),
        correlationId,
      });

      console.warn("[Dodo Webhook] payment.failed:", data.payment_id, "email:", email);
    } catch (err) {
      console.error("[Dodo Webhook] payment.failed handler error:", err);
      throw err;
    }
  },

  // ── Subscription events ──

  onSubscriptionActive: async (payload) => {
    try {
      const data = payload.data;
      console.log("[Dodo Webhook] Processing subscription.active:", data.subscription_id);
      const email = requireEmail(data, "subscription.active");

      await activateProSubscription(email, data.subscription_id, data.next_billing_date ? new Date(data.next_billing_date) : null);

      console.log("[Dodo Webhook] subscription.active:", data.subscription_id, "email:", email);
    } catch (err) {
      console.error("[Dodo Webhook] subscription.active handler error:", err);
      throw err;
    }
  },

  onSubscriptionRenewed: async (payload) => {
    try {
      const data = payload.data;
      console.log("[Dodo Webhook] Processing subscription.renewed:", data.subscription_id);
      const email = requireEmail(data, "subscription.renewed");

      await renewProSubscription(email, data.subscription_id, data.next_billing_date ? new Date(data.next_billing_date) : null);

      console.log("[Dodo Webhook] subscription.renewed:", data.subscription_id, "email:", email);
    } catch (err) {
      console.error("[Dodo Webhook] subscription.renewed handler error:", err);
      throw err;
    }
  },

  onSubscriptionCancelled: async (payload) => {
    try {
      const data = payload.data;
      console.log("[Dodo Webhook] Processing subscription.cancelled:", data.subscription_id);
      const email = requireEmail(data, "subscription.cancelled");

      // If the gateway indicates cancel-at-period-end, keep the user active until expiry
      const cancelAtEnd = (data as Record<string, unknown>).cancel_at_next_billing_date === true;

      if (cancelAtEnd) {
        await markCancelAtPeriodEnd(email, data.next_billing_date ? new Date(data.next_billing_date) : null);
        console.log("[Dodo Webhook] subscription.cancelled (at period end):", data.subscription_id, "email:", email);
      } else {
        await setSubscriptionStatus(email, "cancelled");
        console.warn("[Dodo Webhook] subscription.cancelled (immediate):", data.subscription_id, "email:", email);
      }
    } catch (err) {
      console.error("[Dodo Webhook] subscription.cancelled handler error:", err);
      throw err;
    }
  },

  onSubscriptionFailed: async (payload) => {
    try {
      const data = payload.data;
      console.log("[Dodo Webhook] Processing subscription.failed:", data.subscription_id);
      const email = requireEmail(data, "subscription.failed");

      await setSubscriptionStatus(email, "failed");

      console.warn("[Dodo Webhook] subscription.failed:", data.subscription_id, "email:", email);
    } catch (err) {
      console.error("[Dodo Webhook] subscription.failed handler error:", err);
      throw err;
    }
  },

  onSubscriptionExpired: async (payload) => {
    try {
      const data = payload.data;
      console.log("[Dodo Webhook] Processing subscription.expired:", data.subscription_id);
      const email = requireEmail(data, "subscription.expired");

      await setSubscriptionStatus(email, "expired");

      console.warn("[Dodo Webhook] subscription.expired:", data.subscription_id, "email:", email);
    } catch (err) {
      console.error("[Dodo Webhook] subscription.expired handler error:", err);
      throw err;
    }
  },
});
