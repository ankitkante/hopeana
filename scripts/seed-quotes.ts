import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load DATABASE_URL before importing prisma (which reads it at init time)
dotenv.config({ path: path.resolve(__dirname, "../packages/db/.env") });

interface Quote {
  content: string;
  author: string;
  category: string;
}

const quotesPath = path.resolve(__dirname, "data/quotes.json");
const quotes: Quote[] = JSON.parse(fs.readFileSync(quotesPath, "utf-8"));

async function seedQuotes() {
  // Dynamic import so prisma initializes AFTER dotenv has loaded
  const { prisma } = await import("../packages/db/src/index");

  console.log(`Seeding ${quotes.length} quotes into QuotesBank...`);

  const existing = await prisma.quotesBank.count();
  if (existing > 0) {
    console.log(`QuotesBank already has ${existing} quotes. Skipping duplicates...`);
  }

  let created = 0;
  let skipped = 0;

  for (const quote of quotes) {
    const exists = await prisma.quotesBank.findFirst({
      where: { content: quote.content },
    });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.quotesBank.create({ data: quote });
    created++;
  }

  console.log(`Done! Created: ${created}, Skipped (already exist): ${skipped}`);
  console.log(`Total quotes in bank: ${await prisma.quotesBank.count()}`);

  await prisma.$disconnect();
}

seedQuotes().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
