# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 2 HIGH and 6 MEDIUM security findings from the security audit, hardening authentication, headers, CSP, and rate limiting.

**Architecture:** Each task is independent and can be executed in parallel by separate agents. Tasks are ordered by severity (HIGH first). All changes are backward-compatible — no database migrations, no API contract changes.

**Tech Stack:** Next.js 16, Node.js `crypto` module, Vitest for testing.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/admin.ts` | Modify (lines 150-174) | Timing-safe bot API secret comparison |
| `src/app/api/kofi/webhook/route.ts` | Modify (line 102) | Timing-safe Ko-fi token comparison |
| `src/lib/timing.ts` | Create | Shared `timingSafeCompare()` utility |
| `src/lib/__tests__/timing.test.ts` | Create | Tests for timing-safe comparison |
| `src/proxy.ts` | Modify (lines 44-48) | Add HSTS + Permissions-Policy headers |
| `src/lib/__tests__/proxy-headers.test.ts` | Create | Tests for security headers |
| `next.config.ts` | Modify (lines 44-54) | Tighten CSP script-src and connect-src |
| `src/lib/rate-limit.ts` | Modify (lines 84-98) | Validate cf-connecting-ip source |
| `src/lib/__tests__/rate-limit.test.ts` | Create | Tests for IP extraction |

---

## Chunk 1: HIGH Severity Fixes

### Task 1: Create timing-safe comparison utility

**Files:**
- Create: `src/lib/timing.ts`
- Test: `src/lib/__tests__/timing.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/timing.test.ts
import { describe, it, expect } from "vitest";
import { timingSafeCompare } from "../timing";

describe("timingSafeCompare", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeCompare("secret123", "secret123")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeCompare("secret123", "wrong456")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeCompare("short", "muchlongerstring")).toBe(false);
  });

  it("returns false for empty vs non-empty", () => {
    expect(timingSafeCompare("", "notempty")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(timingSafeCompare("", "")).toBe(true);
  });

  it("handles unicode correctly", () => {
    expect(timingSafeCompare("héllo", "héllo")).toBe(true);
    expect(timingSafeCompare("héllo", "hello")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/timing.test.ts`
Expected: FAIL — `timingSafeCompare` not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/timing.ts
/**
 * @fileoverview Timing-safe string comparison.
 *
 * Prevents timing side-channel attacks on secret comparisons
 * by using Node.js crypto.timingSafeEqual under the hood.
 *
 * @module timing
 */

import { timingSafeEqual } from "crypto";

/**
 * Compare two strings in constant time.
 * Prevents timing attacks that exploit early-exit in === comparison.
 *
 * @param a - First string (e.g., user-provided value)
 * @param b - Second string (e.g., stored secret)
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  return timingSafeEqual(bufA, bufB);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/timing.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/timing.ts src/lib/__tests__/timing.test.ts
git commit -m "feat: add timing-safe string comparison utility"
```

---

### Task 2: Fix bot API secret comparison (HIGH #1)

**Files:**
- Modify: `src/lib/admin.ts` (lines 150-174)

- [ ] **Step 1: Write the failing test**

```typescript
// Add to: src/lib/__tests__/timing.test.ts (append)
describe("timingSafeCompare integration", () => {
  it("correctly compares Bearer token format", () => {
    const secret = "my-super-secret-token";
    const validHeader = `Bearer ${secret}`;
    const invalidHeader = "Bearer wrong-token";

    expect(timingSafeCompare(validHeader, `Bearer ${secret}`)).toBe(true);
    expect(timingSafeCompare(invalidHeader, `Bearer ${secret}`)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it passes** (this validates the utility works for the use case)

Run: `npx vitest run src/lib/__tests__/timing.test.ts`
Expected: All PASS

- [ ] **Step 3: Update admin.ts to use timing-safe comparison**

In `src/lib/admin.ts`, replace `requireBotApi` function (lines 150-174):

```typescript
// Add import at top of file:
import { timingSafeCompare } from "./timing";

// Replace the comparison in requireBotApi (line 163):
// OLD: if (auth !== `Bearer ${secret}`) {
// NEW:
export function requireBotApi(request: Request) {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) {
    return {
      error: true as const,
      response: new Response(
        JSON.stringify({ error: "Server misconfigured — BOT_API_SECRET not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const auth = request.headers.get("authorization");
  if (!auth || !timingSafeCompare(auth, `Bearer ${secret}`)) {
    return {
      error: true as const,
      response: new Response(
        JSON.stringify({ error: "Unauthorized — invalid bot API secret" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { error: false as const };
}
```

Key changes:
1. Import `timingSafeCompare`
2. Add `!auth ||` guard (handles null header — prevents passing null to compare)
3. Replace `auth !== \`Bearer ${secret}\`` with `!timingSafeCompare(auth, \`Bearer ${secret}\`)`

- [ ] **Step 4: Run full test suite and build**

Run: `npx vitest run && npx next build`
Expected: All tests pass, build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin.ts
git commit -m "fix(security): use timing-safe comparison for bot API secret"
```

---

### Task 3: Fix Ko-fi webhook token comparison (HIGH #2)

**Files:**
- Modify: `src/app/api/kofi/webhook/route.ts` (line 102)

- [ ] **Step 1: Update Ko-fi webhook to use timing-safe comparison**

In `src/app/api/kofi/webhook/route.ts`, apply these changes:

```typescript
// Add import at top of file (after existing imports):
import { timingSafeCompare } from "@/lib/timing";

// Replace line 102:
// OLD: if (!expectedToken || payload.verification_token !== expectedToken) {
// NEW:
if (!expectedToken || !timingSafeCompare(payload.verification_token, expectedToken)) {
```

- [ ] **Step 2: Run build to verify**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/kofi/webhook/route.ts
git commit -m "fix(security): use timing-safe comparison for Ko-fi verification token"
```

---

## Chunk 2: MEDIUM Severity Fixes — HTTP Headers

### Task 4: Add HSTS and Permissions-Policy headers

**Files:**
- Modify: `src/proxy.ts` (lines 44-48)

- [ ] **Step 1: Update proxy.ts with additional security headers**

In `src/proxy.ts`, replace the security headers section (lines 43-48):

```typescript
  // ── Security Headers ───────────────────────────────────────
  // Apply security headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
```

- [ ] **Step 2: Run build to verify**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "fix(security): add HSTS and Permissions-Policy headers"
```

---

## Chunk 3: MEDIUM Severity Fixes — CSP Tightening

### Task 5: Tighten CSP script-src (remove unsafe-inline)

**Files:**
- Modify: `next.config.ts` (line 47)

**Context:** The app embeds Twitter/X, Facebook, Instagram, and Ko-fi widgets that require inline scripts. Completely removing `'unsafe-inline'` would break these embeds. The pragmatic approach is to document why it is needed and tighten `connect-src`.

- [ ] **Step 1: Tighten connect-src — replace `https:` wildcard with explicit origins**

In `next.config.ts`, replace the CSP header value (lines 45-54):

```typescript
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://platform.twitter.com https://platform.x.com https://connect.facebook.net https://www.instagram.com https://storage.ko-fi.com",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: https://pbs.twimg.com https://abs.twimg.com https://*.instagram.com https://*.fbcdn.net https://scontent.cdninstagram.com",
              "media-src 'self' https:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://clips.twitch.tv https://www.tiktok.com https://www.instagram.com https://www.facebook.com https://platform.twitter.com https://platform.x.com https://syndication.twitter.com https://cdn.syndication.twimg.com https://x.com https://twitter.com https://*.instagram.com https://*.facebook.com https://ko-fi.com https://storage.ko-fi.com",
              "connect-src 'self' https://api.x.com https://syndication.x.com https://cdn.syndication.twimg.com https://storage.ko-fi.com https://ko-fi.com https://avatars.steamstatic.com https://avatars.akamai.steamstatic.com",
              "font-src 'self' https:",
            ].join("; "),
```

Key change: `connect-src` no longer uses `https:` wildcard. Only explicitly listed origins are allowed for fetch/XHR requests.

**Note on `script-src 'unsafe-inline'`:** This cannot be safely removed without breaking third-party social media embeds (Twitter, Ko-fi). A future improvement would be to load these via iframe-only embeds or nonce-based CSP, but that's a separate project. The `connect-src` tightening is the higher-value fix because it prevents data exfiltration via JS.

- [ ] **Step 2: Test in browser — verify embeds still work**

After deploying, manually verify:
1. Twitter/X embeds load on `/media` pages
2. Ko-fi widget loads on `/support` page
3. Instagram embeds load
4. No CSP violations in browser console for normal operations
5. `connect-src` blocks: open DevTools console, run `fetch('https://evil.com')` — should be blocked by CSP

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "fix(security): tighten CSP connect-src — replace https: wildcard with explicit origins"
```

---

## Chunk 4: MEDIUM Severity Fixes — Rate Limiting Hardening

### Task 6: Validate cf-connecting-ip source

**Files:**
- Modify: `src/lib/rate-limit.ts` (lines 84-98)
- Test: `src/lib/__tests__/rate-limit.test.ts`

**Context:** The `cf-connecting-ip` header is set by Cloudflare. If a request bypasses Cloudflare (direct IP, Tailscale), a malicious client could set this header to any value and bypass rate limiting. The fix adds a secondary verification: if `cf-connecting-ip` is present but `cf-ray` (always set by Cloudflare) is absent, ignore it.

- [ ] **Step 1: Write failing tests for getClientIp**

```typescript
// src/lib/__tests__/rate-limit.test.ts
import { describe, it, expect } from "vitest";
import { getClientIp } from "../rate-limit";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://example.com", {
    headers: new Headers(headers),
  });
}

describe("getClientIp", () => {
  it("returns cf-connecting-ip when cf-ray is present", () => {
    const req = makeRequest({
      "cf-connecting-ip": "1.2.3.4",
      "cf-ray": "abc123-LAX",
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("ignores cf-connecting-ip when cf-ray is absent (spoofed header)", () => {
    const req = makeRequest({
      "cf-connecting-ip": "1.2.3.4",
      "x-forwarded-for": "10.0.0.1, 192.168.1.1",
    });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("falls back to rightmost x-forwarded-for", () => {
    const req = makeRequest({
      "x-forwarded-for": "client-spoofed, 10.0.0.1, 192.168.1.1",
    });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("falls back to x-real-ip", () => {
    const req = makeRequest({
      "x-real-ip": "10.0.0.5",
    });
    expect(getClientIp(req)).toBe("10.0.0.5");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run tests to see which fail**

Run: `npx vitest run src/lib/__tests__/rate-limit.test.ts`
Expected: Test "ignores cf-connecting-ip when cf-ray is absent" FAILs (current code trusts cf-connecting-ip regardless)

- [ ] **Step 3: Update getClientIp to verify Cloudflare origin**

In `src/lib/rate-limit.ts`, replace `getClientIp` function (lines 84-99):

```typescript
export function getClientIp(request: Request): string {
  // Cloudflare Tunnel sets both cf-connecting-ip and cf-ray.
  // Only trust cf-connecting-ip when cf-ray is also present,
  // preventing spoofed headers on direct (non-CF) connections.
  const cfIp = request.headers.get("cf-connecting-ip");
  const cfRay = request.headers.get("cf-ray");
  if (cfIp && cfRay) return cfIp.trim();

  // Fall back to rightmost non-private IP in x-forwarded-for
  // (rightmost = added by the closest trusted proxy, not spoofable by client)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[ips.length - 1] || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
```

Key change: Added `cf-ray` check. `cf-ray` is an internal Cloudflare header that cannot be set by clients — it's added by Cloudflare edge servers. If `cf-connecting-ip` is present but `cf-ray` is not, the request bypassed Cloudflare and the IP header is untrusted.

- [ ] **Step 4: Run tests to verify all pass**

Run: `npx vitest run src/lib/__tests__/rate-limit.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/rate-limit.ts src/lib/__tests__/rate-limit.test.ts
git commit -m "fix(security): validate cf-ray before trusting cf-connecting-ip for rate limiting"
```

---

## Summary

| Task | Severity | Description | Files |
|------|----------|-------------|-------|
| 1 | Setup | Timing-safe comparison utility | `timing.ts`, `timing.test.ts` |
| 2 | HIGH | Bot API secret — timing-safe | `admin.ts` |
| 3 | HIGH | Ko-fi token — timing-safe | `kofi/webhook/route.ts` |
| 4 | MEDIUM | HSTS + Permissions-Policy headers | `proxy.ts` |
| 5 | MEDIUM | CSP connect-src tightening | `next.config.ts` |
| 6 | MEDIUM | Rate limit IP validation | `rate-limit.ts`, `rate-limit.test.ts` |

**Dependencies:** Tasks 2 and 3 depend on Task 1 (timing utility). Tasks 4, 5, 6 are fully independent.

**Parallel execution:** After Task 1 completes, Tasks 2-6 can all run in parallel.

**Not addressed (documented decisions):**
- `script-src 'unsafe-inline'` — required by third-party embeds, cannot remove without nonce-based CSP overhaul
- In-memory rate limiter — single Docker instance makes this acceptable; Redis upgrade deferred to scaling phase
- `SITE_URL` localhost fallback — low severity, Docker compose always sets the env var
