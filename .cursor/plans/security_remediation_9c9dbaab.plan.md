---
name: security remediation
overview: "Remediate the highest-risk issues from the deep security review: public exposure of non-public content, stale authorization state, client-trusted data, and missing abuse controls. Then harden email/rendering/config surfaces and verify the fixes with targeted checks."
todos:
  - id: containment-gates
    content: Add status/published checks to public detail routes and related interaction endpoints
    status: pending
  - id: auth-revalidation
    content: Make admin and ban checks consult live DB state instead of stale JWT claims
    status: pending
  - id: faceit-integrity
    content: Remove or harden client-trusted FACEIT stat persistence
    status: pending
  - id: abuse-controls
    content: Add missing rate limits and enforce validated media tags/moderation defaults
    status: pending
  - id: output-hardening
    content: Escape contact email HTML and tighten CSP/image policies
    status: pending
  - id: security-verification
    content: Verify no non-public content or revoked users can still access protected behavior
    status: pending
isProject: false
---

# Security Remediation

## Immediate Containment

- Enforce publication/moderation gates anywhere individual content is loaded by ID.
- Update [src/app/(public)/opinions/[id]/page.tsx](src/app/(public)/opinions/[id]/page.tsx), [src/app/api/opinions/[id]/route.ts](src/app/api/opinions/[id]/route.ts), and [src/app/api/articles/[id]/route.ts](src/app/api/articles/[id]/route.ts) so non-admin users only receive `APPROVED` opinions and `published` articles.
- Extend the same checks to interaction endpoints that currently operate on hidden content: [src/app/api/opinions/[id]/comments/route.ts](src/app/api/opinions/[id]/comments/route.ts), [src/app/api/opinions/[id]/vote/route.ts](src/app/api/opinions/[id]/vote/route.ts), [src/app/api/media/[id]/comments/route.ts](src/app/api/media/[id]/comments/route.ts), and [src/app/api/media/[id]/vote/route.ts](src/app/api/media/[id]/vote/route.ts).

## Authorization Hardening

- Stop treating JWT role/ban claims as the only source of truth for sensitive checks.
- Refactor [src/lib/auth.ts](src/lib/auth.ts) and [src/lib/admin.ts](src/lib/admin.ts) so role and ban state are revalidated from the database for privileged routes, and make sure bans/demotions take effect immediately.
- Decide whether `ADMIN_STEAM_IDS` is bootstrap-only or authoritative; remove the current behavior that preserves stored `ADMIN` even after env removal if that is not intended.

## Abuse And Integrity Controls

- Replace client-trusted FACEIT persistence in [src/app/api/user/faceit/route.ts](src/app/api/user/faceit/route.ts) and [src/components/auth/FaceitSync.tsx](src/components/auth/FaceitSync.tsx) with a server-verified strategy, or stop persisting unverifiable FACEIT ranks.
- Add missing rate limits to [src/app/api/media/route.ts](src/app/api/media/route.ts), [src/app/api/media/[id]/comments/route.ts](src/app/api/media/[id]/comments/route.ts), and [src/app/api/opinions/[id]/comments/route.ts](src/app/api/opinions/[id]/comments/route.ts).
- Align moderation defaults with project policy by revisiting [prisma/schema.prisma](prisma/schema.prisma) and the create routes for user content.
- Fix `media.tags` validation so [src/app/api/media/route.ts](src/app/api/media/route.ts) only writes schema-validated tag arrays.

## Output And Platform Hardening

- Escape or safely template contact email HTML in [src/app/api/contact/route.ts](src/app/api/contact/route.ts), and normalize proxy-derived client IP parsing with [src/lib/rate-limit.ts](src/lib/rate-limit.ts).
- Tighten browser hardening in [next.config.ts](next.config.ts) by reducing CSP allowances where feasible and replacing the wildcard image host policy with an allowlist.
- Review admin HTML storage/rendering in [src/components/blog/ArticleContent.tsx](src/components/blog/ArticleContent.tsx) and [src/lib/validations.ts](src/lib/validations.ts) so stored article HTML is constrained before persistence, not only on render.

## Verification

- Manually verify that pending/rejected opinions and unpublished articles are inaccessible to anonymous users through both page routes and API routes.
- Verify that banning or demoting a currently logged-in user immediately removes access to protected routes.
- Smoke-test submission, comment, vote, contact, and upload flows to confirm rate limits and sanitization still work as intended.

