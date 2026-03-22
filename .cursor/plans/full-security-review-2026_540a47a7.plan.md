---
name: full-security-review-2026
overview: Comprehensive red/black-hat security review of savecounterstrike repo - validated existing plans, confirmed IDORs, FACEIT trust issues, weak CSP/rate limiting, session authority gaps, and more. Ready for remediation.
todos:
  - id: fix-idor-articles
    content: Add published check + admin guard to GET in src/app/api/articles/[id]/route.ts
    status: pending
  - id: fix-idor-opinions
    content: Add status filter + auth guard to GET in src/app/api/opinions/[id]/route.ts and related endpoints
    status: pending
  - id: harden-faceit
    content: Remove trust in POST body for FACEIT stats or implement server verification in src/app/api/user/faceit/route.ts
    status: pending
  - id: refresh-session-auth
    content: Add DB refresh for role/ban in auth flows (src/lib/auth.ts)
    status: pending
  - id: tighten-csp-rate
    content: Harden CSP in next.config.ts and improve rate limiting IP trust (use CF-Connecting-IP)
    status: pending
isProject: false
---

# Full Deep Security Review (Red/Black Hat Perspective)

**Validated & Expanded from prior plans** (`.cursor/plans/security_review_report_7ecb8f0f.plan.md` and `security_remediation_eef26299.plan.md`).

**Critical Findings (exploitable today):**

- IDOR on `/api/articles/[id]` and `/api/opinions/[id]` (no visibility/status checks for non-admins).
- Client-controlled FACEIT stats in `/api/user/faceit/route.ts` (arbitrary ELO/level injection).
- Stale JWT role/ban claims (no DB refresh on requests).
- Weak rate limiting (spoofable `x-forwarded-for`, in-memory only).
- Permissive CSP (`unsafe-inline`/`unsafe-eval`, broad `connect-src` and image patterns).

**Positive Controls:**

- Solid Steam OpenID verification + ban checks.
- Sanitization pipeline (`sanitize-html` + DOMPurify + profanity filter).
- Non-root Docker, basic headers.

**Remediation Priorities (matching existing plans):**

1. Fix all IDOR/detail routes (`src/app/api/articles/[id]/route.ts`, opinions/media/comments/votes).
2. Harden FACEIT + session authority (`src/lib/auth.ts`, FACEIT endpoint).
3. Tighten CSP/rate limits (`next.config.ts`, `src/lib/rate-limit.ts`).
4. Normalize admin guards (`src/lib/admin.ts`).
5. Update moderation defaults (`prisma/schema.prisma`).

**Files to change (high-impact):**

- `[src/app/api/articles/[id]/route.ts](src/app/api/articles/[id]/route.ts)`
- `[src/app/api/opinions/[id]/route.ts](src/app/api/opinions/[id]/route.ts)`
- `[src/app/api/user/faceit/route.ts](src/app/api/user/faceit/route.ts)`
- `[next.config.ts](next.config.ts)`
- `[src/lib/auth.ts](src/lib/auth.ts)` and `[src/lib/admin.ts](src/lib/admin.ts)`
- `[src/lib/rate-limit.ts](src/lib/rate-limit.ts)`
- `[prisma/schema.prisma](prisma/schema.prisma)`

**Next:** Confirm remediation scope or specific todos to implement first. No code changes until approved.

**Status:** Research complete. Plan saved to `.cursor/plans/`.