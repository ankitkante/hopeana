import { prisma, type Schedule } from "db";
import { Autosend, type BulkSendEmailOptions, type BulkRecipient } from "autosendjs";
import { isScheduleDue, isInPreferredWindow } from "./is-schedule-due";

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
  return used < limit && sub.status !== "cancelled" && sub.status !== "failed" && sub.status !== "expired";
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

  // 6. Prepare recipients (pick a unique quote per user)
  const prepared: { schedule: typeof batch[number]; quote: { id: string; content: string; author: string | null }; recipient: BulkRecipient }[] = [];

  for (const schedule of batch) {
    // Enforce monthly cap per user (Pro=30 via webhook reset, Free=5 default)
    const allowed = await canSendAnotherEmail(schedule.userId);
    if (!allowed) {
      result.skipped++;
      continue;
    }

    const quote = await pickQuote(schedule.userId, quotes.map((q) => q.id));

    if (!quote) {
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
        result.errors.push(
          `Bulk send failed for ${chunk.length} emails: ${typeof bulkResponse.error === "object" ? JSON.stringify(bulkResponse.error) : bulkResponse.error || "unknown error"}`
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
    } catch (err) {
      result.failed += chunk.length;
      const message = err instanceof Error ? err.message : String(err);
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
 * Pick a random quote that the user hasn't been sent recently.
 * Falls back to any random quote if all have been sent.
 */
async function pickQuote(userId: string, allQuoteIds: string[]) {
  // Get IDs of quotes recently sent to this user
  const recentlySent = await prisma.sentMessage.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: Math.min(allQuoteIds.length - 1, 50), // keep at least 1 available
    select: { quoteId: true },
  });

  const sentIds = new Set(recentlySent.map((m) => m.quoteId));
  const unseenIds = allQuoteIds.filter((id) => !sentIds.has(id));

  // Pick from unseen, or fall back to all if everything has been seen
  const pool = unseenIds.length > 0 ? unseenIds : allQuoteIds;
  const randomId = pool[Math.floor(Math.random() * pool.length)];

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
