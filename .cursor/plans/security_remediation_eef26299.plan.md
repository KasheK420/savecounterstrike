---
name: security remediation
overview: Remediate the highest-risk authorization, moderation, and trust-boundary issues identified during the security audit, then tighten operational hardening around CSP, image fetching, and secret handling.
todos:
  - id: refresh-session-authority
    content: Refresh role and ban state from DB on authenticated requests instead of trusting stale JWT claims.
    status: pending
  - id: close-detail-route-bypasses
    content: Apply published/status checks consistently to detail, comments, and vote endpoints.
    status: pending
  - id: fix-moderation-defaults
    content: Change UGC defaults to PENDING and stop auto-moderation from restoring manually hidden content.
    status: pending
  - id: harden-trust-boundaries
    content: Remove client-trusted FACEIT writes and tighten CSP/image host policy.
    status: pending
  - id: add-security-regression-tests
    content: Add or run targeted tests for authorization and moderation regressions.
    status: pending
isProject: false
---

# Security Remediation Plan

## Priority Fixes

- Rework session authority in `[src/lib/auth.ts](src/lib/auth.ts)` so role and ban state are refreshed from the database instead of trusting long-lived JWT claims after initial login.
- Align detail and interaction routes with public visibility rules used by list routes:
  - `[src/app/api/articles/[id]/route.ts](src/app/api/articles/[id]/route.ts)`
  - `[src/app/api/opinions/[id]/route.ts](src/app/api/opinions/[id]/route.ts)`
  - `[src/app/api/opinions/[id]/comments/route.ts](src/app/api/opinions/[id]/comments/route.ts)`
  - `[src/app/api/media/[id]/comments/route.ts](src/app/api/media/[id]/comments/route.ts)`
  - `[src/app/api/opinions/[id]/vote/route.ts](src/app/api/opinions/[id]/vote/route.ts)`
  - `[src/app/api/media/[id]/vote/route.ts](src/app/api/media/[id]/vote/route.ts)`
  - `[src/app/api/comments/[id]/vote/route.ts](src/app/api/comments/[id]/vote/route.ts)`
- Fix moderation defaults and state transitions so user-submitted content starts as `PENDING` and manual `HIDDEN` moderation cannot be silently undone:
  - `[prisma/schema.prisma](prisma/schema.prisma)`
  - `[src/app/api/opinions/route.ts](src/app/api/opinions/route.ts)`
  - `[src/app/api/media/route.ts](src/app/api/media/route.ts)`
  - `[src/lib/moderation.ts](src/lib/moderation.ts)`

## Hardening

- Remove client trust for FACEIT persistence in `[src/app/api/user/faceit/route.ts](src/app/api/user/faceit/route.ts)` and decide on one of two safe models: server-verified sync, or explicitly user-claimed/untrusted display data.
- Tighten frontend/network policy in `[next.config.ts](next.config.ts)`: restrict `images.remotePatterns`, reduce CSP permissiveness, and add stronger framing controls if compatible with the app.
- Reduce low-value exposure in public profile APIs and config examples:
  - `[src/app/api/users/[id]/route.ts](src/app/api/users/[id]/route.ts)`
  - `[.env.example](.env.example)`
- Review bot/admin storage surfaces for sensitive data and loose payload contracts:
  - `[src/app/api/admin/bot/command/route.ts](src/app/api/admin/bot/command/route.ts)`
  - `[src/app/api/admin/bot/config/route.ts](src/app/api/admin/bot/config/route.ts)`

## Validation

- Add focused regression coverage for authz and moderation edge cases around ban revocation, role demotion, unpublished content access, hidden-content comments/votes, and moderation restore behavior.
- Re-test all affected routes from anonymous, authenticated user, moderator, and admin perspectives.

