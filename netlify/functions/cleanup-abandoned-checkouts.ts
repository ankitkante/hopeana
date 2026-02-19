import type { Config, Context } from "@netlify/functions";
import { prisma } from "db";

const ABANDONED_AFTER_HOURS = 48;

export default async (_req: Request, _context: Context) => {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_HOURS * 60 * 60 * 1000);

  const result = await prisma.payment.updateMany({
    where: {
      gatewayPaymentId: { startsWith: "pending_" },
      status: "pending",
      createdAt: { lt: cutoff },
    },
    data: { status: "abandoned" },
  });

  console.log(`Cleanup: marked ${result.count} abandoned checkout placeholder(s) (older than ${ABANDONED_AFTER_HOURS}h)`);

  return new Response(JSON.stringify({ abandoned: result.count }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  schedule: "0 2 * * *", // daily at 2 AM UTC
};
