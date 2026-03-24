# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma db push           # Push schema changes to database
npx prisma db seed           # Seed the database (via tsx prisma/seed.ts)
npx prisma studio            # Open Prisma Studio GUI
npx prisma generate          # Regenerate Prisma client after schema changes
```

## Architecture

Full-stack Next.js App Router application (single codebase). All pages are client components that fetch from internal API routes. Backend logic lives exclusively in `src/app/api/` routes.

**Key files:**
- `src/lib/auth.ts` — Session management (HTTP-only cookies, 7-day expiry). All API routes call `getSession()` for auth.
- `src/lib/db.ts` — Prisma client singleton (prevents connection pool exhaustion in dev).
- `src/components/shared.tsx` — Sidebar navigation, `StatusBadge`, label helpers, and formatters shared across dashboard pages.
- `prisma/schema.prisma` — Four models: `Usuario`, `Veiculo`, `Funcionario`, `Servico`.

**Routing:**
- `/` — Login page (no auth required)
- `/dashboard` — Stats overview with active jobs and team status
- `/dashboard/veiculos` — Vehicle management (MUNCK, GUINDASTE, EMPILHADEIRA)
- `/dashboard/funcionarios` — Employee management
- `/dashboard/servicos` — Service/job creation and listing (two-step vehicle allocation)
- `/dashboard/financeiro` — Financial view of services

**Role-based access:** Three user roles (COMERCIAL, OPERACIONAL, FINANCEIRO) stored in session cookie. The Sidebar shows/hides navigation items based on `cargo`.

## Database

Development uses SQLite (`prisma/dev.db`). Production uses PostgreSQL via `DATABASE_URL` env var.

Default seed credentials (password: `klm2026`):
- `comercial@klm.com`
- `operacional@klm.com`
- `financeiro@klm.com`

When changing `DATABASE_URL` between SQLite and PostgreSQL, run `npx prisma db push` to sync the schema.

## Business Domain

KLM Guindastes — heavy vehicle rental operations. Core workflow:
1. A `Servico` (job) is created with client info, a requested vehicle type, and scheduling.
2. Vehicles and employees are assigned (vehicle status flips to `EM_USO`).
3. Job completes → vehicle returns to `DISPONIVEL`.

`Servico` has a two-step vehicle assignment: `tipoVeiculoSolicitado`/`qtdVeiculos` (request) → `veiculoId` (actual assignment).
