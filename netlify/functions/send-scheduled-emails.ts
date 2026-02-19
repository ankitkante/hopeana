import type { Config, Context } from "@netlify/functions";
import { sendDueEmails } from "core";
import { createLogger } from "utils";

const logger = createLogger('netlify:scheduler');

export default async (req: Request, context: Context) => {
  logger.info("Scheduled email run started");

  const result = await sendDueEmails();

  logger.info("Scheduled email run complete", {
    sent: result.sent,
    failed: result.failed,
    skipped: result.skipped,
    remaining: result.remaining,
  });

  if (result.errors.length > 0) {
    logger.error("Scheduled email run errors", { errors: result.errors });
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  schedule: "*/15 * * * *", // every 15 minutes
};
