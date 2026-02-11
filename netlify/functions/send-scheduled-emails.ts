import type { Config, Context } from "@netlify/functions";
import { sendDueEmails } from "core";

export default async (req: Request, context: Context) => {
  console.log("Running scheduled email send...");

  const result = await sendDueEmails();

  console.log(
    `Done: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped, ${result.remaining} remaining for next hour`
  );

  if (result.errors.length > 0) {
    console.error("Errors:", result.errors);
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  schedule: "*/15 * * * *", // every 15 minutes
};
