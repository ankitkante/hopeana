# Hopeana

Motivation-as-a-Service. Pick your preferred medium of communication and receive motivational quotes at your selected time and frequency.

## Overview

Hopeana delivers personalized motivational quotes via email on user-defined schedules. Users choose their preferred time of day (morning, afternoon, or evening), frequency (daily, specific days, or custom intervals), and timezone. A scheduled function runs every 15 minutes and sends quote emails to users whose schedules are due.

Built as a pnpm monorepo with Next.js, Prisma, and PostgreSQL.

## Project Structure

```
hopeana/
├── apps/
│   ├── client/              # Next.js 16 web application (App Router)
│   └── server/              # Backend server (planned)
├── packages/
│   ├── core/                # Scheduled email sending, timing logic
│   ├── db/                  # Prisma ORM with PostgreSQL
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utilities
├── scripts/                 # Operational scripts (seeding, testing)
│   ├── data/quotes.json     # Motivational quotes data (100 quotes, 10 categories)
│   ├── seed-quotes.ts       # Seed QuotesBank from quotes.json
│   └── test-scheduler.ts    # Test scheduled email pipeline locally
├── email_templates/         # HTML email template source files
├── netlify/functions/       # Netlify scheduled functions
└── pnpm-workspace.yaml
```

## Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript 5.9, Tailwind CSS 4
- **Database**: PostgreSQL via Prisma 7.2 (with @prisma/adapter-pg)
- **Email**: Autosend (autosendjs SDK) with template-based sending
- **Hosting**: Netlify (with scheduled functions for cron)
- **Forms**: React Hook Form + Yup validation

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+ (`npm i -g pnpm`)
- PostgreSQL database (e.g., Supabase)

### Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment variables**:

   Create `packages/db/.env`:
   ```
   DATABASE_URL="postgresql://..."
   ```

   Create `apps/client/.env.local`:
   ```
   DATABASE_URL="postgresql://..."
   EMAIL_API_KEY="your-autosend-api-key"
   WELCOME_FROM_EMAIL="welcome@yourdomain.com"
   WELCOME_EMAIL_TEMPLATE_ID="your-template-id"
   HOPEANA_REPLY_TO_EMAIL="reply@yourdomain.com"
   QUOTE_EMAIL_TEMPLATE_ID="your-quote-template-id"
   QUOTE_FROM_EMAIL="quotes@yourdomain.com"
   ```

3. **Push database schema**:
   ```bash
   pnpm --filter db db:push
   ```

4. **Seed quotes**:
   ```bash
   pnpm seed:quotes
   ```

5. **Start development server**:
   ```bash
   pnpm --filter client dev
   ```

## Commands

```bash
# Development
pnpm --filter client dev          # Start Next.js dev server (port 3000)
pnpm --filter client build        # Build for production
pnpm --filter client lint         # Run ESLint

# Database
pnpm --filter db generate         # Generate Prisma client
pnpm --filter db db:push          # Push schema changes to PostgreSQL

# Scripts
pnpm seed:quotes                  # Seed motivational quotes into QuotesBank
pnpm test:scheduler               # Test scheduled email sending locally

# Dependencies
pnpm install                      # Install all workspace dependencies
```

## How Scheduled Emails Work

1. A **Netlify scheduled function** runs every 15 minutes via cron
2. It calls `sendDueEmails()` from `packages/core`, which:
   - Fetches all active email schedules
   - Filters to schedules that are due (based on time window, frequency, timezone)
   - Picks a unique unseen quote per user
   - Sends emails via Autosend's bulk API (up to 100 per call)
   - Logs each send to `SentMessage` for duplicate prevention

### Time Windows (in user's timezone)

| Window    | Hours         | 15-min Slots |
|-----------|---------------|--------------|
| Morning   | 6 AM – 12 PM  | 24           |
| Afternoon | 12 PM – 5 PM  | 20           |
| Evening   | 5 PM – 9 PM   | 16           |

## License

See LICENSE file.
