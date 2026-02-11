/**
 * Quick local test script for the scheduled email sender.
 *
 * Usage:  pnpm test:scheduler
 *
 * Prerequisites:
 *   - At least 1 active Schedule (channel="email") in the DB
 *   - At least 1 active QuotesBank record in the DB
 *   - apps/client/.env.local has DATABASE_URL, AUTOSEND_API_KEY, QUOTE_EMAIL_TEMPLATE_ID, QUOTE_FROM_EMAIL
 */

import dotenv from "dotenv";
import path from "path";

// Load all env vars from apps/client/.env.local (has DB + email keys)
dotenv.config({ path: path.resolve(__dirname, "../apps/client/.env.local") });

console.log("Environment loaded. Key vars:");
console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "set" : "MISSING");
console.log("  EMAIL_API_KEY:", process.env.EMAIL_API_KEY ? "set" : "MISSING");
console.log("  QUOTE_EMAIL_TEMPLATE_ID:", process.env.QUOTE_EMAIL_TEMPLATE_ID || "MISSING");
console.log("  QUOTE_FROM_EMAIL:", process.env.QUOTE_FROM_EMAIL || "MISSING");
console.log();

async function main() {
  const { sendDueEmails } = await import("../packages/core/src/send-due-emails");

  console.log("Running sendDueEmails()...");
  console.log("Current time:", new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }), "(IST)");
  console.log();

  const result = await sendDueEmails();

  console.log("Result:");
  console.log(JSON.stringify(result, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
