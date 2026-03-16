import { prisma, type Schedule } from "db";
import { Autosend, type BulkSendEmailOptions, type BulkRecipient } from "autosendjs";
import { isScheduleDue, isInPreferredWindow } from "./is-schedule-due";
import { createLogger } from "utils";

const logger = createLogger('core:send-due-emails');

/** Cron interval in minutes. Used to calculate available slots in a window. */
const CRON_INTERVAL_MIN = 15;

/** Smallest window is evening (4 hrs). Used as fallback for slot calculation. */
const MIN_WINDOW_HOURS = 4;

/** Hard cap per invocation. With bulk API (100 emails/call at 2 req/sec)
 *  and DB overhead, 500 fits within Netlify's 30s scheduled function timeout. */
const MAX_PER_INVOCATION = 500;

/** Max emails per bulk API call (Autosend limit). */
const BULK_CHUNK_SIZE = 100;

/** Default monthly limit for users without a subscription row (free tier). */
const DEFAULT_FREE_MONTHLY_LIMIT = 5;

/** Alert admin when a user has fewer unseen quotes than this threshold. */
const LOW_QUOTE_THRESHOLD = 5;

/**
 * Check if a user can send another email based on their Subscription row.
 * Falls back to DEFAULT_FREE_MONTHLY_LIMIT if no row exists.
 */
async function canSendAnotherEmail(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    // No subscription row yet → treat as free tier starting at 0/5
    return true;
  }
  const limit = sub.messageLimit ?? DEFAULT_FREE_MONTHLY_LIMIT;
  const used = sub.messagesUsed ?? 0;
  const allowed = used < limit && sub.status !== "cancelled" && sub.status !== "failed" && sub.status !== "expired";
  if (!allowed) {
    logger.debug("Monthly cap reached, skipping user", { userId, used, limit, status: sub.status });
  }
  return allowed;
}

/**
 * Increment messagesUsed for a user, creating a free-tier row if none exists.
 * Webhooks will upsert Pro plan rows on activation/renewal with 30-limit and reset usage.
 */
async function incrementUsage(userId: string): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: "free",
      status: "active",
      messageLimit: DEFAULT_FREE_MONTHLY_LIMIT,
      messagesUsed: 1,
    },
    update: {
      messagesUsed: { increment: 1 },
    },
  });
}

/**
 * Return the IDs of quotes from the bank that have NOT yet been sent to this user.
 */
async function getUnseenQuoteIds(userId: string, allQuoteIds: string[]): Promise<string[]> {
  const sentQuotes = await prisma.sentMessage.findMany({
    where: { userId, status: "sent" },
    select: { quoteId: true },
    distinct: ["quoteId"],
  });
  const sentIds = new Set(sentQuotes.map((m) => m.quoteId));
  return allQuoteIds.filter((id) => !sentIds.has(id));
}

/**
 * Send a low-quotes alert email to the admin (HOPEANA_REPLY_TO_EMAIL).
 */
async function sendLowQuotesAlert(
  autosend: InstanceType<typeof Autosend>,
  userId: string,
  userEmail: string,
  remainingCount: number,
): Promise<void> {
  const adminEmail = process.env.HOPEANA_REPLY_TO_EMAIL || "";
  if (!adminEmail) {
    logger.warn("HOPEANA_REPLY_TO_EMAIL not set, cannot send low-quotes alert");
    return;
  }

  try {
    await autosend.emails.send({
      from: {
        email: adminEmail,
        name: "Hopeana System",
      },
      to: { email: adminEmail },
      subject: `[Hopeana Alert] Low quotes for user ${userId}`,
      html: `<p>Quotes for user <strong>${userId}</strong> (email: <strong>${userEmail}</strong>) are about to end. Please add new quotes to the Quotes bank.</p><p>Remaining unseen quotes: <strong>${remainingCount}</strong></p>`,
    });
    logger.info("Low-quotes alert sent", { userId, userEmail, remainingCount });
  } catch (err) {
    logger.error("Failed to send low-quotes alert", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Send a zero-quotes warning email to the admin (HOPEANA_REPLY_TO_EMAIL).
 */
async function sendZeroQuotesAlert(
  autosend: InstanceType<typeof Autosend>,
  userId: string,
  userEmail: string,
): Promise<void> {
  const adminEmail = process.env.HOPEANA_REPLY_TO_EMAIL || "";
  if (!adminEmail) {
    logger.warn("HOPEANA_REPLY_TO_EMAIL not set, cannot send zero-quotes alert");
    return;
  }

  try {
    await autosend.emails.send({
      from: {
        email: adminEmail,
        name: "Hopeana System",
      },
      to: { email: adminEmail },
      subject: `[Hopeana Alert] No quotes remaining for user ${userId}`,
      html: `<p>There are <strong>no more quotes</strong> to send for user <strong>${userId}</strong> (email: <strong>${userEmail}</strong>).</p><p>No email was sent to this user. Please add new quotes to the Quotes bank immediately.</p>`,
    });
    logger.info("Zero-quotes alert sent", { userId, userEmail });
  } catch (err) {
    logger.error("Failed to send zero-quotes alert", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  remaining: number;
  errors: string[];
}

/**
 * Main orchestrator: finds all due schedules and sends quote emails.
 *
 * Dynamically calculates batch size based on how many emails are due.
 * The cron runs every 15 minutes. Small batches go out immediately;
 * large batches are spread across available slots in the window.
 *
 * Emails are sent via Autosend's bulk API (up to 100 per call) for throughput.
 * Schedules are shuffled before processing so different users get served each
 * invocation, preventing starvation when volume exceeds capacity.
 *
 * This function is deployment-agnostic — call it from a Netlify scheduled
 * function, a Vercel cron, a plain node-cron script, or anything else.
 */
export async function sendDueEmails(): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, skipped: 0, remaining: 0, errors: [] };

  const autosend = new Autosend(process.env.EMAIL_API_KEY || "");

  // 1. Fetch all active email schedules with their user and last sent message
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true, channel: "email" },
    include: {
      user: true,
      sentMessages: {
        where: { status: "sent" },
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
  });

  // 2. Get available quotes
  const quotes = await prisma.quotesBank.findMany({
    where: { isActive: true },
  });

  if (quotes.length === 0) {
    logger.error("No active quotes found in QuotesBank");
    result.errors.push("No active quotes found in QuotesBank");
    return result;
  }

  const now = new Date();

  // 3. Filter to due schedules only
  const dueSchedules = schedules.filter((schedule) => {
    const lastSent = schedule.sentMessages[0] ?? null;
    return isScheduleDue(schedule, lastSent, now);
  });

  result.skipped = schedules.length - dueSchedules.length;

  logger.info("Schedules evaluated", {
    total: schedules.length,
    due: dueSchedules.length,
    skipped: result.skipped,
    quotes: quotes.length,
  });

  // 4. Shuffle for fairness, then stable-sort so in-window emails
  //    still go before overflow — but within each group the order is random.
  //    This prevents the same users from always being at the front of the queue.
  shuffleArray(dueSchedules);
  dueSchedules.sort((a, b) => {
    const aInWindow = isInPreferredWindow(a, now) ? 0 : 1;
    const bInWindow = isInPreferredWindow(b, now) ? 0 : 1;
    return aInWindow - bInWindow;
  });

  // 5. Dynamic batch size based on email count
  const batchSize = calculateBatchSize(dueSchedules.length);
  const batch = dueSchedules.slice(0, batchSize);
  result.remaining = Math.max(0, dueSchedules.length - batchSize);

  logger.info("Batch selected", { batchSize, remaining: result.remaining });

  // 6. Prepare recipients (pick a unique quote per user)
  const prepared: { schedule: typeof batch[number]; quote: { id: string; content: string; author: string | null }; recipient: BulkRecipient }[] = [];
  const allQuoteIds = quotes.map((q) => q.id);
  // Track users already alerted this invocation to avoid duplicate alert emails
  const alertedUsers = new Set<string>();

  for (const schedule of batch) {
    // Enforce monthly cap per user (Pro=30 via webhook reset, Free=5 default)
    const allowed = await canSendAnotherEmail(schedule.userId);
    if (!allowed) {
      result.skipped++;
      continue;
    }

    // Get unseen quotes for this user (filtered via SentMessage table)
    const unseenIds = await getUnseenQuoteIds(schedule.userId, allQuoteIds);

    if (unseenIds.length === 0) {
      // No quotes left — skip user and alert admin
      if (!alertedUsers.has(schedule.userId)) {
        alertedUsers.add(schedule.userId);
        await sendZeroQuotesAlert(autosend, schedule.userId, schedule.user.email);
      }
      logger.warn("No unseen quotes remaining for user, skipping", { userId: schedule.userId });
      result.skipped++;
      continue;
    }

    if (unseenIds.length < LOW_QUOTE_THRESHOLD && !alertedUsers.has(schedule.userId)) {
      // Low quotes — alert admin but still send the quote
      alertedUsers.add(schedule.userId);
      await sendLowQuotesAlert(autosend, schedule.userId, schedule.user.email, unseenIds.length);
    }

    const quote = await pickQuote(unseenIds);

    if (!quote) {
      logger.warn("No unsent quotes available for user", { userId: schedule.userId });
      result.errors.push(`No unsent quotes available for user ${schedule.userId}`);
      result.failed++;
      continue;
    }

    prepared.push({
      schedule,
      quote,
      recipient: {
        email: schedule.user.email,
        name: schedule.user.firstName || undefined,
        dynamicData: {
          firstName: schedule.user.firstName || "there",
          quoteContent: quote.content,
          quoteAuthor: quote.author || "Unknown",
          currentYear: now.getFullYear().toString(),
        },
      },
    });
  }

  // 7. Send in bulk chunks of 100
  const chunks = chunkArray(prepared, BULK_CHUNK_SIZE);

  for (const chunk of chunks) {
    const bulkPayload: BulkSendEmailOptions = {
      from: {
        email: process.env.QUOTE_FROM_EMAIL || process.env.WELCOME_FROM_EMAIL || "",
        name: "Hopeana",
      },
      replyTo: {
        email: process.env.HOPEANA_REPLY_TO_EMAIL || "",
        name: "Hopeana Support",
      },
      subject: "Your Daily Dose of Motivation",
      templateId: process.env.QUOTE_EMAIL_TEMPLATE_ID || "",
      recipients: chunk.map((item) => item.recipient),
    };

    try {
      const bulkResponse = await autosend.emails.bulk(bulkPayload);

      if (bulkResponse.success) {
        result.sent += chunk.length;
        logger.info("Bulk chunk sent", { count: chunk.length, totalSent: result.sent });
        for (const item of chunk) {
          await prisma.sentMessage.create({
            data: {
              userId: item.schedule.userId,
              scheduleId: item.schedule.id,
              quoteId: item.quote.id,
              channel: "email",
              status: "sent",
            },
          });
          // Increment monthly usage for the user after successful send
          await incrementUsage(item.schedule.userId);
        }
      } else {
        result.failed += chunk.length;
        const errMsg = `Bulk send failed for ${chunk.length} emails: ${typeof bulkResponse.error === "object" ? JSON.stringify(bulkResponse.error) : bulkResponse.error || "unknown error"}`;
        logger.error("Bulk chunk failed", { count: chunk.length, error: bulkResponse.error });
        result.errors.push(errMsg);
        for (const item of chunk) {
          try {
            await prisma.sentMessage.create({
              data: {
                userId: item.schedule.userId,
                scheduleId: item.schedule.id,
                quoteId: item.quote.id,
                channel: "email",
                status: "failed",
              },
            });
          } catch {
            // If logging fails, continue
          }
        }
      }
    } catch (err) {
      result.failed += chunk.length;
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Bulk chunk error", { count: chunk.length, error: message });
      result.errors.push(
        `Bulk send error for ${chunk.length} emails: ${message}`
      );

      for (const item of chunk) {
        try {
          await prisma.sentMessage.create({
            data: {
              userId: item.schedule.userId,
              scheduleId: item.schedule.id,
              quoteId: item.quote.id,
              channel: "email",
              status: "failed",
            },
          });
        } catch {
          // If logging fails, continue
        }
      }
    }
  }

  logger.info("Run complete", {
    sent: result.sent,
    failed: result.failed,
    skipped: result.skipped,
    remaining: result.remaining,
    errors: result.errors.length,
  });

  return result;
}

/**
 * Calculate how many emails to send in this invocation.
 *
 * Spreads emails evenly across available 15-min slots in the smallest
 * window, but never exceeds MAX_PER_INVOCATION to stay within the
 * serverless function timeout.
 *
 * Capacity per window (at 500 emails/slot via bulk API):
 *   Morning (24 slots):   12,000 emails
 *   Afternoon (20 slots): 10,000 emails
 *   Evening (16 slots):    8,000 emails
 */
function calculateBatchSize(dueCount: number): number {
  const slotsInWindow = (MIN_WINDOW_HOURS * 60) / CRON_INTERVAL_MIN;
  const spread = Math.ceil(dueCount / slotsInWindow);
  return Math.min(spread, MAX_PER_INVOCATION, dueCount);
}

/**
 * Pick a random quote from the provided unseen quote IDs.
 * Callers must filter out already-sent quotes before calling this function.
 */
async function pickQuote(unseenQuoteIds: string[]) {
  if (unseenQuoteIds.length === 0) return null;

  const randomId = unseenQuoteIds[Math.floor(Math.random() * unseenQuoteIds.length)];
  return prisma.quotesBank.findUnique({ where: { id: randomId } });
}

/** Fisher-Yates shuffle — mutates the array in place. */
function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** Split an array into chunks of a given size. */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
