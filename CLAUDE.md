# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hopeana is a "Motivation-as-a-Service" platform that delivers personalized motivational quotes via email, SMS, or push notifications at user-specified frequencies. Built as a pnpm monorepo.

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

## Architecture

### Monorepo Structure
- **apps/client** - Next.js 16 web application (App Router)
- **apps/server** - Backend server (planned)
- **packages/db** - Prisma ORM with PostgreSQL, exports `prisma` client singleton
- **packages/core** - Core business logic (scheduled email sending, timing logic)
- **packages/types** - Shared TypeScript types
- **packages/utils** - Shared utilities
- **scripts/** - One-off operational scripts (seeding, data migrations). Run with `tsx` via root `package.json` commands

### Tech Stack
- Next.js 16.1.1 with React 19, TypeScript 5.9
- Tailwind CSS 4 for styling
- Prisma 7.2 with PostgreSQL (uses @prisma/adapter-pg)
- React Hook Form + Yup for form handling
- Material Design Icons (@mdi/react)

### Path Aliases
```
db       → packages/db/src
core     → packages/core/src
utils    → packages/utils/src
types    → packages/types/src
@/*      → apps/client/* (client-specific)
```

### Database Models
- **User** - Account info with social login support
- **Subscription** - Plan tracking (free trial = 5 messages, pro = 30/month)
- **Schedule** - Delivery preferences (channel, frequency, timezone)
- **SentMessage** - Delivery tracking with status
- **QuotesBank** - Repository of motivational quotes

### Key Patterns
- **Schema changes require a db push + generate** — any edit to `packages/db/prisma/schema.prisma` must be followed by `pnpm --filter db generate` (to regenerate the Prisma client types) and `pnpm --filter db db:push` (to sync PostgreSQL). No migration files are used. **Important:** `db:push` only syncs the DB that `DATABASE_URL` points to (usually the local/direct Supabase connection in `packages/db/.env`). After merging a PR with schema changes, remind the user to run `pnpm --filter db db:push` against the production Supabase DB if it hasn't been done already.
- Prisma singleton in `packages/db/src/index.ts` - import as `import { prisma } from 'db'`
- Multi-step forms use React Context (see `onboarding-context.tsx`)
- API routes use Next.js route handlers with Prisma transactions
- API response format: `{ success: true, data: {...} }` for success, `{ error: "message" }` for errors
- Auth check in API routes: `const auth = await getUserFromRequest(request)` from `@/lib/get-user-from-request`
- Server components by default; `"use client"` for interactive components

### Authentication
- JWT-based auth using `jose` library (`apps/client/lib/auth.ts`)
- Token stored in HTTP-only cookie: `hopeana_token` (7-day expiration)
- Token payload: `{ userId: string; email: string }`
- `getUserFromRequest()` (`apps/client/lib/get-user-from-request.ts`) extracts user from request — checks injected headers first, falls back to cookie verification
- Auth status endpoint: `GET /api/auth/status`

### Dashboard & Settings
- Dashboard at `/dashboard` — client component, fetches user/subscription/schedules/messageStats via `Promise.all`
- Settings at `/dashboard/settings` — tabbed layout (Personal Info, Subscription, My Schedules)
- Settings uses nested routes: `/dashboard/settings/subscription`, `/dashboard/settings/schedules`
- `DashboardHeader` component shared between dashboard and settings (includes avatar dropdown with Settings + Logout)
- Account deactivation is soft-delete: sets `user.isActive = false` and pauses all schedules (no data deletion)

### UI Component Patterns
- Cards: `bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6`
- Primary buttons: `bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg`
- Form inputs: `rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3` with `focus:ring-2 focus:ring-primary/30`
- Form validation: React Hook Form + Yup with `yupResolver`, `mode: "onBlur"`
- Icons: `@mdi/react` with `@mdi/js` icon paths
- Loading skeletons: `animate-pulse` with gray placeholder divs
- Tables: CSS Grid-based (`grid-cols-12`) responsive layout, not `<table>` elements (see `SentMessagesTable`)

## Autosend (Email Service)

SDK package: `autosendjs` (v1.0.3+). Initialized once per request handler with the API key from `EMAIL_API_KEY` env var.

Emails are sent via `autosend.emails.send()`. The project uses the **templateId** approach — templates are created in the Autosend dashboard, and dynamic values are injected via `dynamicData`.

- **HTML source files** live in `email_templates/`. These are the source designs to upload into Autosend as templates — they are not used at runtime.
- The HTML templates use `{{variable}}` syntax for placeholders. All `{{...}}` tokens in the HTML must have a matching key in `dynamicData` (or be set as static vars in the Autosend dashboard).
- Welcome email `dynamicData` keys: `firstName`, `lastName`, `frequency`, `timeOfDay`. Other template variables should be set as static variables in the Autosend template dashboard.
- Email is sent **after** the DB transaction commits. A failed email send does not roll back user/schedule creation.

## Scheduled Email Sending

The system sends motivational quote emails on user-defined schedules. Architecture separates portable core logic from the deployment trigger, so switching hosting only requires rewriting a thin wrapper.

### How It Works
- **Netlify scheduled function** (`netlify/functions/send-scheduled-emails.ts`) runs every 15 minutes via cron (`*/15 * * * *`), calls `sendDueEmails()` from `packages/core`
- **`sendDueEmails()`** (`packages/core/src/send-due-emails.ts`) — main orchestrator: queries active schedules, filters to due ones, picks unseen quotes per user, sends via Autosend, logs to `SentMessage`
- **`isScheduleDue()`** (`packages/core/src/is-schedule-due.ts`) — pure function that determines if a schedule should fire now based on time windows, frequency, timezone, and duplicate prevention

### Time Windows (in user's timezone)
- **Morning**: 6 AM – 12 PM (24 fifteen-min slots)
- **Afternoon**: 12 PM – 5 PM (20 fifteen-min slots)
- **Evening**: 5 PM – 9 PM (16 fifteen-min slots)

### Batching & Overflow
- **Bulk API**: uses `autosend.emails.bulk()` with shared `from`/`subject`/`templateId` at top level and `recipients: BulkRecipient[]` with per-recipient `dynamicData`. Up to 100 emails per call. Hard cap of 500 emails per invocation.
- **Capacity per window**: Morning ~12,000, Afternoon ~10,000, Evening ~8,000 emails
- **Fairness**: schedules are shuffled (Fisher-Yates) before processing so different users get served each invocation, preventing starvation
- **Overflow**: if a window can't send all due emails, remaining emails continue sending in later slots (even past the window end). Overflow stops at midnight — unsent emails from yesterday are dropped
- **Priority**: in-window emails are prioritized over overflow emails via sort
- **Duplicate prevention**: `alreadySentToday()` checks `SentMessage` records (status `"sent"` only — failed sends don't count) to avoid sending twice in one day

### Quote Selection
- `pickQuote()` selects a random quote the user hasn't received recently, falling back to any quote if all have been seen

### Quote Email Template
- Template source: `email_templates/quote-email.html`
- `dynamicData` keys: `firstName`, `quoteContent`, `quoteAuthor`, `currentYear`
- Static template vars (set in Autosend dashboard): `manage_subscription_url`, `unsubscribe_url`

## Scripts (`scripts/`)

Operational scripts live at the repo root in `scripts/`, run via `tsx`. They use a dynamic `await import()` for the prisma client so `dotenv` loads `DATABASE_URL` before prisma initializes.

- **`seed-quotes.ts`** — Seeds `QuotesBank` from `scripts/data/quotes.json` (100 quotes, 10 categories). Skips duplicates by content match. Run: `pnpm seed:quotes`
- **`test-scheduler.ts`** — Locally invokes `sendDueEmails()` to test the scheduled email pipeline end-to-end. Loads env from `apps/client/.env.local`. Run: `pnpm test:scheduler`
- **`data/quotes.json`** — Quote data file. Add/remove entries here to manage the quote bank.

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required by db package)
- `JWT_SECRET` - Secret key for signing/verifying JWT auth tokens (used by `apps/client/lib/auth.ts`)
- `EMAIL_API_KEY` - Autosend email service API key
- `WELCOME_FROM_EMAIL` - Sender address for outgoing emails
- `WELCOME_EMAIL_TEMPLATE_ID` - Template ID for the welcome email
- `HOPEANA_REPLY_TO_EMAIL` - Reply-to address for outgoing emails
- `QUOTE_EMAIL_TEMPLATE_ID` - Template ID for the scheduled quote email
- `QUOTE_FROM_EMAIL` - Sender address for quote emails (can reuse `WELCOME_FROM_EMAIL`)
