@AGENTS.md

# SaveCounterStrike

Community petition & protest site demanding Valve implement proper anti-cheat in CS2. Open letter delivered August 31, 2026.

**Live:** https://savecounterstrike.com
**Repo:** https://github.com/KasheK420/savecounterstrike

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack, `proxy.ts` instead of middleware)
- **Database:** PostgreSQL via Prisma ORM (`src/lib/db.ts` singleton)
- **Auth:** Steam OpenID 2.0 → NextAuth v5 (JWT sessions, no DB sessions)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Editor:** Tiptap (opinions, admin articles)
- **Email:** Nodemailer via Proton Mail SMTP
- **Tests:** Vitest + @testing-library/react
- **Deploy:** Docker → GitHub Actions → DockerHub → Watchtower (auto-pull)

## Architecture

```
Browser → Cloudflare Tunnel → Nginx Proxy Manager → Docker container → PostgreSQL
```

- Deployed via Docker (see docker-compose.prod.yml)
- Server details in private `.env` / root CLAUDE.md — never commit infrastructure info here

## Key Patterns

### Auth
- Steam OpenID 2.0 → manual implementation in `src/lib/steam.ts`
- JWT contains: `steamId`, `role` ("USER"|"MODERATOR"|"ADMIN"), `userId`
- Session types extended in `src/types/next-auth.d.ts` — use `session.user.userId` not `(session.user as any).userId`
- Roles: ADMIN from `ADMIN_STEAM_IDS` env, MODERATOR manually assigned, USER default
- FACEIT stats fetched **client-side** (`src/components/auth/FaceitSync.tsx`) — FACEIT API blocks datacenter IPs

### API Routes
- All mutations require auth check: `const session = await auth()`
- Rate limiting via `src/lib/rate-limit.ts` (IP-based, in-memory)
- Input validation with Zod schemas in `src/lib/validations.ts`
- HTML sanitization: DOMPurify + sanitize-html double pass (`src/lib/sanitize.ts`)
- Admin checks: `requireAdminApi()` / `requireModeratorApi()` from `src/lib/admin.ts`

### Privacy
- `src/lib/mask.ts` — server-only masking for public data (maskDisplayName, maskSteamId)
- Public APIs never expose full steamId or raw user data
- `/api/signatures` returns pre-masked data, raw values never reach JSON response

### Data (Prisma)
- `PetitionSignature` — one per user (unique userId), optional message
- `Opinion` / `OpinionVote` / `Comment` / `CommentVote` — Reddit-style voting
- `MediaSubmission` — user-submitted cheater clips
- `TrackedPlayer` / `BanSnapshot` / `BanWave` — VAC tracking
- `SiteConfig` — JSON key-value store for notable signers, supporters, etc.
- Prisma JSON fields need `as any` for writes (Prisma typing limitation, use `eslint-disable-next-line`)

## Versioning

**Automatic semantic versioning** on every push to master (in deploy.yml):

| Commit prefix | Bump | Example |
|--------------|------|---------|
| `BREAKING` / `BREAKING CHANGE` | Major | 1.0.0 → 2.0.0 |
| `feat:` | Minor | 1.0.0 → 1.1.0 |
| Everything else | Patch | 1.0.0 → 1.0.1 |

Version + git SHA injected at build time via `next.config.ts` → displayed in footer.
CI version bump commits use `[skip ci]` to prevent infinite loops.

## Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build (type checks included)
npm run lint         # ESLint
npm test             # Vitest (watch mode)
npm run test:ci      # Vitest (single run, for CI)
npx prisma migrate dev    # Run migrations
npx prisma generate       # Regenerate client
```

## CI/CD Pipeline

```
Push to master
  → deploy.yml: auto version bump → lint → Docker build → push to DockerHub
  → Watchtower on server auto-pulls new image within 5 minutes
```

Other workflows:
- `ci.yml` — lint + build + test on PRs
- `codeql.yml` — weekly security analysis + on push/PR
- Dependabot — weekly npm updates, monthly GH Actions updates

## Important: Next.js 16 Gotchas

- `proxy.ts` replaces `middleware.ts`
- `cookies()`, `headers()`, `params`, `searchParams` are all **async** — must `await`
- Turbopack is default (no `--turbopack` flag)
- `next lint` removed — use `npx eslint` directly

## Environment Variables

Required env vars (values in private `.env`, never committed):
- `DATABASE_URL`, `AUTH_SECRET`, `STEAM_API_KEY`, `ADMIN_STEAM_IDS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL`
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FACEIT_CLIENT_KEY`, `FACEIT_API_KEY`

## Don'ts

- Don't use `as any` — extend types properly or use `eslint-disable-next-line` with comment
- Don't expose steamId in public API responses — always mask via `src/lib/mask.ts`
- Don't import server-only modules (`src/lib/mask.ts`, `src/lib/db.ts`) from `"use client"` files
- Don't forget `await` on Next.js 16 async APIs (cookies, headers, params)
- **Don't commit server IPs, ports, paths, or credentials into this repo**
