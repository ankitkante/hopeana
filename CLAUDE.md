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
- **packages/core** - Core business logic (placeholder)
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

SDK package: `autosendjs`. Initialized once per request handler with the API key:
```typescript
import { Autosend } from 'autosendjs';
const autosend = new Autosend(process.env.AUTOSEND_API_KEY || '');
```

Emails are sent via `autosend.emails.send()`. The project uses the **templateId** approach — templates are created in the Autosend dashboard, and dynamic values are injected via `dynamicData`:
```typescript
await autosend.emails.send({
  from: { email: process.env.WELCOME_FROM_EMAIL },
  to:   { email: recipientEmail },
  subject: '...',
  templateId: process.env.WELCOME_EMAIL_TEMPLATE_ID,
  dynamicData: { firstName, lastName, frequency, timeOfDay },
});
```

- **From address domain**: `mail.hopeana.com`
- **HTML source files** live in `email_templates/` (e.g. `welcome-email.html`). These are the source designs to upload into Autosend as templates — they are not used at runtime.
- The HTML templates use `{{variable}}` syntax for placeholders. All `{{...}}` tokens in the HTML must have a matching key in `dynamicData` (or be set as static vars in the Autosend dashboard).
- Welcome email `dynamicData` keys: `firstName`, `lastName`, `frequency`, `timeOfDay`. The template also references `dashboard_url`, `website_url`, `support_email`, `account_url`, `manage_subscription_url`, `support_url`, `privacy_url` — these should be set as static variables in the Autosend template dashboard.
- Email is sent **after** the DB transaction commits. A failed email send does not roll back user/schedule creation.

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required by db package)
- `AUTOSEND_API_KEY` - Email service API key
- `WELCOME_FROM_EMAIL` - Sender address (e.g. `hello@mail.hopeana.com`)
- `WELCOME_EMAIL_TEMPLATE_ID` - Template ID for the welcome email
