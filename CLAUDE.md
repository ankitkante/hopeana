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
- **Schedule** - Delivery preferences (channel, frequency, timezone)
- **SentMessage** - Delivery tracking with status
- **QuotesBank** - Repository of motivational quotes

### Key Patterns
- **Schema changes require a db push** — any edit to `packages/db/prisma/schema.prisma` must be followed by `pnpm --filter db db:push` to sync PostgreSQL. No migration files are used.
- Prisma singleton in `packages/db/src/index.ts` - import as `import { prisma } from 'db'`
- Multi-step forms use React Context (see `onboarding-context.tsx`)
- API routes use Next.js route handlers with Prisma transactions
- Server components by default; `"use client"` for interactive components

## Autosend (Email Service)

SDK package: `autosendjs`. Initialized once per request handler with the API key from `AUTOSEND_API_KEY` env var.

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
- **Bulk API**: uses `autosend.emails.bulk()` to send up to 100 emails per API call (vs 1-by-1). Hard cap of 500 emails per invocation.
- **Capacity per window**: Morning ~12,000, Afternoon ~10,000, Evening ~8,000 emails
- **Fairness**: schedules are shuffled (Fisher-Yates) before processing so different users get served each invocation, preventing starvation
- **Overflow**: if a window can't send all due emails, remaining emails continue sending in later slots (even past the window end). Overflow stops at midnight — unsent emails from yesterday are dropped
- **Priority**: in-window emails are prioritized over overflow emails via sort
- **Duplicate prevention**: `alreadySentToday()` checks `SentMessage` records to avoid sending twice in one day

### Quote Selection
- `pickQuote()` selects a random quote the user hasn't received recently, falling back to any quote if all have been seen

### Quote Email Template
- Template source: `email_templates/quote-email.html`
- `dynamicData` keys: `firstName`, `quoteContent`, `quoteAuthor`, `currentYear`
- Static template vars (set in Autosend dashboard): `manage_subscription_url`, `unsubscribe_url`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required by db package)
- `AUTOSEND_API_KEY` - Email service API key
- `WELCOME_FROM_EMAIL` - Sender address for outgoing emails
- `WELCOME_EMAIL_TEMPLATE_ID` - Template ID for the welcome email
- `HOPEANA_REPLY_TO_EMAIL` - Reply-to address for outgoing emails
- `QUOTE_EMAIL_TEMPLATE_ID` - Template ID for the scheduled quote email
- `QUOTE_FROM_EMAIL` - Sender address for quote emails (can reuse `WELCOME_FROM_EMAIL`)
