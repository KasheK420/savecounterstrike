@AGENTS.md

# savecounterstrike

Community petition & protest site against Valve's CS2 anti-cheat.

## Stack

- Next.js 16 (App Router, Turbopack default)
- PostgreSQL (shared instance via Prisma)
- NextAuth v5 (Steam OpenID 2.0, JWT sessions)
- Tailwind CSS v4 + shadcn/ui
- Docker (multi-stage, standalone output)

## Conventions

- English-only site (no i18n)
- Auth via Steam SSO only — no email/password
- Admin access via ADMIN_STEAM_IDS env var (Steam64 format)
- All user-submitted content defaults to PENDING status
- API routes: `src/app/api/`
- Components: `src/components/`
- All DB access through `src/lib/db.ts` (Prisma singleton)
- Validations with Zod in `src/lib/validations.ts`
- Content rendering: react-markdown + remark-gfm (no Tiptap)

## Important: Next.js 16 Changes

- `proxy.ts` instead of `middleware.ts`
- `cookies()`, `headers()`, `params`, `searchParams` are fully async
- Turbopack is default (no --turbopack flag needed)
- `next lint` removed — use ESLint directly

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npx prisma migrate dev` — run migrations
- `npx prisma generate` — regenerate client
