import { prisma, type Schedule } from "db";
import { Autosend, type SendEmailOptions } from "autosendjs";
import { isScheduleDue } from "./is-schedule-due";

interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Main orchestrator: finds all due schedules and sends quote emails.
 *
 * This function is deployment-agnostic — call it from a Netlify scheduled
 * function, a Vercel cron, a plain node-cron script, or anything else.
 */
export async function sendDueEmails(): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, skipped: 0, errors: [] };

  const autosend = new Autosend(process.env.EMAIL_API_KEY || "");

  // 1. Fetch all active email schedules with their user and last sent message
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true, channel: "email" },
    include: {
      user: true,
      sentMessages: {
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

  // 3. Process each schedule
  for (const schedule of schedules) {
    const lastSent = schedule.sentMessages[0] ?? null;

    if (!isScheduleDue(schedule, lastSent, now)) {
      result.skipped++;
      continue;
    }

    try {
      // Pick a quote the user hasn't received recently
      const quote = await pickQuote(schedule.userId, quotes.map((q) => q.id));

      if (!quote) {
        result.errors.push(`No unsent quotes available for user ${schedule.userId}`);
        result.failed++;
        continue;
      }

      // Send email
      const emailPayload: SendEmailOptions = {
        from: {
          email: process.env.QUOTE_FROM_EMAIL || process.env.WELCOME_FROM_EMAIL || "",
          name: "Hopeana",
        },
        to: { email: schedule.user.email },
        replyTo: {
          email: process.env.HOPEANA_REPLY_TO_EMAIL || "",
          name: "Hopeana Support",
        },
        subject: "Your Daily Dose of Motivation",
        templateId: process.env.QUOTE_EMAIL_TEMPLATE_ID || "",
        dynamicData: {
          firstName: schedule.user.firstName || "there",
          quoteContent: quote.content,
          quoteAuthor: quote.author || "Unknown",
          currentYear: now.getFullYear().toString(),
        },
      };

      const emailResponse = await autosend.emails.send(emailPayload);

      // Log to SentMessage
      const status = emailResponse?.success ? "sent" : "failed";
      await prisma.sentMessage.create({
        data: {
          userId: schedule.userId,
          scheduleId: schedule.id,
          quoteId: quote.id,
          channel: "email",
          status,
        },
      });

      if (status === "sent") {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(
          `Email send returned failure for user ${schedule.userId}`
        );
      }
    } catch (err) {
      result.failed++;
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(
        `Error processing schedule ${schedule.id}: ${message}`
      );

      // Still log the failed attempt
      try {
        await prisma.sentMessage.create({
          data: {
            userId: schedule.userId,
            scheduleId: schedule.id,
            quoteId: "unknown",
            channel: "email",
            status: "failed",
          },
        });
      } catch {
        // If logging fails too, just continue
      }
    }
  }

  return result;
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
