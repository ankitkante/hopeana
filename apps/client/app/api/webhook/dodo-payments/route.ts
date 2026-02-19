// apps/client/app/api/webhook/dodo-payments/route.ts
import { Webhooks } from "@dodopayments/nextjs";
import { prisma } from "db";
import { PaymentStatus } from "@prisma/client";
import { createLogger } from "utils";

const logger = createLogger('webhook:dodo-payments');

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
    logger.error("Missing customer email in payload", { eventType });
    throw new Error(`Missing customer email in ${eventType}`);
  }
  return email;
}

/** Find local user by email. Returns null and logs if not found. */
async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn("No local user for email", { email });
  } else {
    logger.debug("Matched user", { userId: user.id, email });
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
  logger.info("Subscription upgraded to Pro", { userId: user.id });
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
  logger.info("Subscription renewed", { userId: user.id });
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
    logger.info("Subscription status updated", { status, userId: user.id });
  } catch {
    logger.warn("No existing subscription row to update", { status, userId: user.id });
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
    logger.info("cancelAtPeriodEnd set", { userId: user.id });
  } catch {
    logger.warn("No existing subscription row for cancelAtPeriodEnd", { userId: user.id });
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
  status: PaymentStatus;
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
      logger.info("Placeholder updated to real payment", { paymentId: opts.gatewayPaymentId, status: opts.status, userId: user?.id ?? "unknown" });
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
  logger.info("Payment upserted", { paymentId: opts.gatewayPaymentId, status: opts.status, userId: user?.id ?? "unknown" });
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,

  onPayload: async (payload) => {
    logger.debug("Webhook event received", { type: payload.type });
  },

  // ── Payment events ──

  onPaymentSucceeded: async (payload) => {
    try {
      const data = payload.data;
      logger.debug("Processing payment.succeeded", { paymentId: data.payment_id });
      const email = requireEmail(data, "payment.succeeded");

      if (!data?.payment_id) {
        logger.error("payment.succeeded missing payment_id");
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

      logger.info("payment.succeeded", { paymentId: data.payment_id, email });
    } catch (err) {
      logger.error("payment.succeeded handler error", { error: err });
      throw err;
    }
  },

  onPaymentFailed: async (payload) => {
    try {
      const data = payload.data;
      logger.debug("Processing payment.failed", { paymentId: data.payment_id });
      const email = requireEmail(data, "payment.failed");

      if (!data?.payment_id) {
        logger.error("payment.failed missing payment_id");
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

      logger.warn("payment.failed", { paymentId: data.payment_id, email });
    } catch (err) {
      logger.error("payment.failed handler error", { error: err });
      throw err;
    }
  },

  // ── Subscription events ──

  onSubscriptionActive: async (payload) => {
    try {
      const data = payload.data;
      logger.debug("Processing subscription.active", { subscriptionId: data.subscription_id });
      const email = requireEmail(data, "subscription.active");

      await activateProSubscription(email, data.subscription_id, data.next_billing_date ? new Date(data.next_billing_date) : null);

      logger.info("subscription.active", { subscriptionId: data.subscription_id, email });
    } catch (err) {
      logger.error("subscription.active handler error", { error: err });
      throw err;
    }
  },

  onSubscriptionRenewed: async (payload) => {
    try {
      const data = payload.data;
      logger.debug("Processing subscription.renewed", { subscriptionId: data.subscription_id });
      const email = requireEmail(data, "subscription.renewed");

      await renewProSubscription(email, data.subscription_id, data.next_billing_date ? new Date(data.next_billing_date) : null);

      logger.info("subscription.renewed", { subscriptionId: data.subscription_id, email });
    } catch (err) {
      logger.error("subscription.renewed handler error", { error: err });
      throw err;
    }
  },

  onSubscriptionCancelled: async (payload) => {
    try {
      const data = payload.data;
      logger.debug("Processing subscription.cancelled", { subscriptionId: data.subscription_id });
      const email = requireEmail(data, "subscription.cancelled");

      // If the gateway indicates cancel-at-period-end, keep the user active until expiry
      const cancelAtEnd = (data as Record<string, unknown>).cancel_at_next_billing_date === true;

      if (cancelAtEnd) {
        await markCancelAtPeriodEnd(email, data.next_billing_date ? new Date(data.next_billing_date) : null);
        logger.info("subscription.cancelled (at period end)", { subscriptionId: data.subscription_id, email });
      } else {
        await setSubscriptionStatus(email, "cancelled");
        logger.warn("subscription.cancelled (immediate)", { subscriptionId: data.subscription_id, email });
      }
    } catch (err) {
      logger.error("subscription.cancelled handler error", { error: err });
      throw err;
    }
  },

  onSubscriptionFailed: async (payload) => {
    try {
      const data = payload.data;
      logger.debug("Processing subscription.failed", { subscriptionId: data.subscription_id });
      const email = requireEmail(data, "subscription.failed");

      await setSubscriptionStatus(email, "failed");

      logger.warn("subscription.failed", { subscriptionId: data.subscription_id, email });
    } catch (err) {
      logger.error("subscription.failed handler error", { error: err });
      throw err;
    }
  },

  onSubscriptionExpired: async (payload) => {
    try {
      const data = payload.data;
      logger.debug("Processing subscription.expired", { subscriptionId: data.subscription_id });
      const email = requireEmail(data, "subscription.expired");

      await setSubscriptionStatus(email, "expired");

      logger.warn("subscription.expired", { subscriptionId: data.subscription_id, email });
    } catch (err) {
      logger.error("subscription.expired handler error", { error: err });
      throw err;
    }
  },
});