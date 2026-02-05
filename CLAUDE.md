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

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required by db package)
- `AUTOSEND_API_KEY` - Email service API key (client app)
