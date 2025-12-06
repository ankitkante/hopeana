# Hopeana

Motivation-as-a-Service. Pick your preferred medium of communication and receive motivational messages at your selected time.

## Overview

Hopeana is a monorepo project built with a modern tech stack, featuring a Next.js frontend and modular backend packages. This project uses pnpm workspaces for dependency management.

## Project Structure

```
hopeana/
├── apps/
│   ├── client/              # Next.js web application (React 19)
│   └── server/              # Backend server (planned)
├── packages/
│   ├── core/                # Core business logic
│   ├── db/                  # Database utilities
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utilities
├── package.json             # Root workspace configuration
└── README.md
```

## Apps

### Client (`apps/client/`)
A Next.js 16 web application built with React 19 and TypeScript. Features include:
- **Framework**: Next.js 16.0.7
- **UI Framework**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint 9

**Available Scripts**:
- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server
- `lint` - Run ESLint

### Server (`apps/server/`)
Backend server application (in development).

## Packages

Shared packages used across the monorepo:

- **`packages/core/`** - Core business logic and domain models
- **`packages/db/`** - Database connection and utilities
- **`packages/types/`** - Shared TypeScript type definitions
- **`packages/utils/`** - Utility functions and helpers

## Requirements

- Node.js 22.0 or higher
- pnpm 10.0 or higher (currently using 10.24.0)

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Development**:
   ```bash
   pnpm --filter client dev
   ```

3. **Build**:
   ```bash
   pnpm --filter client build
   ```

4. **Start production**:
   ```bash
   pnpm --filter client start
   ```

## Scripts

Run scripts from the root directory using pnpm workspaces:

```bash
# Run in specific workspace
pnpm --filter client dev

# Run in all workspaces
pnpm -r test
```

## License
See License file