# Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation layer for the auth system — DB schema, utility modules with comprehensive tests, and validation schemas.

**Architecture:** Prisma schema migration (steamId nullable, new tables), pure utility functions (password hashing, token management, TOTP, CSRF, encryption), Zod validation schemas. All utilities are pure/isolated and independently testable.

**Tech Stack:** Prisma 6.x, bcryptjs, otpauth (TOTP), Node.js crypto, Zod 4.x, Vitest

**Spec:** `docs/superpowers/specs/2026-04-14-auth-system-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add new fields, tables, enums |
| `prisma/migrations/xxx` | Create | Migration for auth schema |
| `src/lib/password.ts` | Create | bcrypt hash/verify, HIBP breach check |
| `src/lib/tokens.ts` | Create | Crypto token generation, SHA-256 hashing |
| `src/lib/mfa.ts` | Create | TOTP generate/verify, AES-256-GCM encrypt/decrypt, recovery codes |
| `src/lib/csrf.ts` | Create | Origin header validation |
| `src/lib/auth-validation.ts` | Create | Zod schemas for all auth inputs |
| `src/lib/email-templates.ts` | Create | HTML email templates for auth flows |
| `src/lib/__tests__/password.test.ts` | Create | Password utility tests |
| `src/lib/__tests__/tokens.test.ts` | Create | Token utility tests |
| `src/lib/__tests__/mfa.test.ts` | Create | MFA utility tests |
| `src/lib/__tests__/csrf.test.ts` | Create | CSRF utility tests |
| `src/lib/__tests__/auth-validation.test.ts` | Create | Auth validation schema tests |
| `package.json` | Modify | Add bcryptjs, otpauth deps |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

```bash
npm install bcryptjs otpauth qrcode
npm install -D @types/bcryptjs @types/qrcode
```

- `bcryptjs` — pure JS bcrypt (no native compilation for Docker)
- `otpauth` — RFC 6238 TOTP implementation
- `qrcode` — QR code generation for MFA setup

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -3`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add bcryptjs, otpauth, qrcode for auth system"
```

---

## Task 2: Prisma schema migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update User model — add auth fields**

Add these fields to the existing User model (after the `steamId` line):

```prisma
model User {
  // ... existing id field ...

  // Identity — at least one must be set (app-level)
  steamId     String?  @unique          // CHANGED: was required
  email       String?  @unique          // NEW

  // Auth
  passwordHash     String?
  emailVerified    Boolean  @default(false)
  emailVerifiedAt  DateTime?
  securityStamp    String   @default(cuid())

  // MFA
  mfaEnabled          Boolean  @default(false)
  mfaSecret           String?
  lastTotpStep        Int?
  pendingMfaSecret    String?
  pendingMfaExpiresAt DateTime?

  // ... rest of existing fields ...

  // NEW relations (add at end of model)
  passwordResetTokens  PasswordResetToken[]
  emailVerifyTokens    EmailVerifyToken[]
  loginAttempts        LoginAttempt[]
  mfaRecoveryCodes     MfaRecoveryCode[]
}
```

- [ ] **Step 2: Add new enums and models**

Add after existing models:

```prisma
enum AuthMethod {
  EMAIL
  STEAM
  MFA
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model EmailVerifyToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model MfaRecoveryCode {
  id        String    @id @default(cuid())
  userId    String
  codeHash  String
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model LoginAttempt {
  id        String     @id @default(cuid())
  userId    String?
  ipHash    String
  userAgent String?
  success   Boolean
  method    AuthMethod
  createdAt DateTime   @default(now())
  user      User?      @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([ipHash, createdAt])
  @@index([userId, createdAt])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  details   Json?
  ipHash    String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action, createdAt])
}
```

- [ ] **Step 3: Generate migration**

Run: `npx prisma migrate dev --name auth-system-foundation`
Expected: Migration created successfully

- [ ] **Step 4: Verify Prisma client**

Run: `npx prisma generate && npx next build 2>&1 | tail -3`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat(db): auth system schema — email, MFA, tokens, audit tables"
```

---

## Task 3: Password utility (src/lib/password.ts)

**Files:**
- Create: `src/lib/password.ts`
- Test: `src/lib/__tests__/password.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/__tests__/password.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword, checkBreachedPassword, validatePasswordStrength } from "../password";

describe("hashPassword", () => {
  it("returns a bcrypt hash string", async () => {
    const hash = await hashPassword("TestPassword1!");
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it("produces different hashes for same input (salt)", async () => {
    const h1 = await hashPassword("TestPassword1!");
    const h2 = await hashPassword("TestPassword1!");
    expect(h1).not.toBe(h2);
  });

  it("rejects passwords longer than 72 bytes", async () => {
    const longPass = "A".repeat(73);
    await expect(hashPassword(longPass)).rejects.toThrow("72 bytes");
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("TestPassword1!");
    expect(await verifyPassword("TestPassword1!", hash)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("TestPassword1!");
    expect(await verifyPassword("WrongPassword1!", hash)).toBe(false);
  });
});

describe("validatePasswordStrength", () => {
  it("accepts valid password", () => {
    expect(validatePasswordStrength("MyStr0ng!Pass")).toEqual({ valid: true, errors: [] });
  });

  it("rejects short password", () => {
    const result = validatePasswordStrength("Short1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least 12 characters");
  });

  it("rejects missing uppercase", () => {
    const result = validatePasswordStrength("alllowercase1!");
    expect(result.valid).toBe(false);
  });

  it("rejects missing lowercase", () => {
    const result = validatePasswordStrength("ALLUPPERCASE1!");
    expect(result.valid).toBe(false);
  });

  it("rejects missing digit", () => {
    const result = validatePasswordStrength("NoDigitsHere!!");
    expect(result.valid).toBe(false);
  });

  it("rejects missing special char", () => {
    const result = validatePasswordStrength("NoSpecialChar1");
    expect(result.valid).toBe(false);
  });

  it("rejects empty string", () => {
    const result = validatePasswordStrength("");
    expect(result.valid).toBe(false);
  });
});

describe("checkBreachedPassword", () => {
  it("returns boolean", async () => {
    // Mock fetch for HIBP API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("0035785EC05FCC5C07039A1C1FB1FABF91F:3\r\nOTHERHASH:1"),
    });
    const result = await checkBreachedPassword("test");
    expect(typeof result).toBe("boolean");
  });

  it("returns false on API timeout/error (fail open + flag)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("timeout"));
    const result = await checkBreachedPassword("test");
    expect(result).toBe(false); // fail open
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run src/lib/__tests__/password.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement password.ts**

```typescript
// src/lib/password.ts
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;
const HIBP_TIMEOUT_MS = 3000;

export async function hashPassword(password: string): Promise<string> {
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    throw new Error(`Password must not exceed ${MAX_PASSWORD_BYTES} bytes`);
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 12) errors.push("at least 12 characters");
  if (!/[A-Z]/.test(password)) errors.push("at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("at least one lowercase letter");
  if (!/\d/.test(password)) errors.push("at least one digit");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("at least one special character");
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) errors.push(`must not exceed ${MAX_PASSWORD_BYTES} bytes`);
  return { valid: errors.length === 0, errors };
}

export async function checkBreachedPassword(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "User-Agent": process.env.HIBP_API_USER_AGENT || "savecounterstrike" },
      signal: AbortSignal.timeout(HIBP_TIMEOUT_MS),
    });

    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\r\n").some((line) => line.startsWith(suffix));
  } catch {
    return false; // Fail open on API error — log externally
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/lib/__tests__/password.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/password.ts src/lib/__tests__/password.test.ts
git commit -m "feat: password utility — bcrypt hash/verify, strength validation, HIBP breach check"
```

---

## Task 4: Token utility (src/lib/tokens.ts)

**Files:**
- Create: `src/lib/tokens.ts`
- Test: `src/lib/__tests__/tokens.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/__tests__/tokens.test.ts
import { describe, it, expect } from "vitest";
import { generateToken, hashToken, generateResetToken, generateVerifyToken } from "../tokens";

describe("generateToken", () => {
  it("returns a hex string of correct length", () => {
    const token = generateToken(32);
    expect(token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
  });

  it("generates unique tokens", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
  });
});

describe("hashToken", () => {
  it("returns consistent SHA-256 hash", () => {
    const token = "test-token-123";
    const h1 = hashToken(token);
    const h2 = hashToken(token);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("different tokens produce different hashes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});

describe("generateResetToken", () => {
  it("returns raw token and hash", () => {
    const { raw, hash, expiresAt } = generateResetToken();
    expect(raw).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashToken(raw));
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 31 * 60 * 1000); // ~30 min
  });
});

describe("generateVerifyToken", () => {
  it("returns raw token and hash with 24h expiry", () => {
    const { raw, hash, expiresAt } = generateVerifyToken();
    expect(hash).toBe(hashToken(raw));
    const hours = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(hours).toBeGreaterThan(23);
    expect(hours).toBeLessThanOrEqual(24.1);
  });
});
```

- [ ] **Step 2: Implement tokens.ts**

```typescript
// src/lib/tokens.ts
import { randomBytes, createHash } from "crypto";

export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken() {
  const raw = generateToken(32);
  return { raw, hash: hashToken(raw), expiresAt: new Date(Date.now() + 30 * 60 * 1000) };
}

export function generateVerifyToken() {
  const raw = generateToken(32);
  return { raw, hash: hashToken(raw), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
}

export function generateRecoveryCodes(count: number = 10): { raw: string[]; hashes: Promise<string[]> } {
  const rawCodes = Array.from({ length: count }, () => randomBytes(8).toString("hex"));
  // Hashes are bcrypt — caller must await
  return { raw: rawCodes, hashes: Promise.resolve(rawCodes) }; // Placeholder — bcrypt done in mfa.ts
}
```

- [ ] **Step 3: Run tests, commit**

Run: `npx vitest run src/lib/__tests__/tokens.test.ts`

```bash
git add src/lib/tokens.ts src/lib/__tests__/tokens.test.ts
git commit -m "feat: token utility — generation, SHA-256 hashing, reset/verify token factories"
```

---

## Task 5: MFA utility (src/lib/mfa.ts)

**Files:**
- Create: `src/lib/mfa.ts`
- Test: `src/lib/__tests__/mfa.test.ts`

- [ ] **Step 1: Write tests**

Tests covering: TOTP generation, verification (±1 window), encryption/decryption, recovery code hashing/verification, replay protection.

- [ ] **Step 2: Implement mfa.ts**

Functions:
- `generateTotpSecret(issuer, accountName)` → { secret, otpauthUri }
- `verifyTotp(secret, code, lastStep?)` → { valid, step }
- `encryptSecret(plaintext)` → encrypted string (v1:iv:ct:tag)
- `decryptSecret(encrypted)` → plaintext
- `hashRecoveryCode(code)` → bcrypt hash
- `verifyRecoveryCode(code, hash)` → boolean
- `generateQrDataUrl(otpauthUri)` → data:image/png;base64,...

- [ ] **Step 3: Run tests, commit**

---

## Task 6: CSRF utility (src/lib/csrf.ts)

**Files:**
- Create: `src/lib/csrf.ts`
- Test: `src/lib/__tests__/csrf.test.ts`

- [ ] **Step 1: Write tests + implement**

```typescript
// src/lib/csrf.ts
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (!origin) return false;
  return origin === new URL(siteUrl).origin;
}
```

Tests: valid origin, wrong origin, missing origin, localhost dev mode.

- [ ] **Step 2: Commit**

---

## Task 7: Auth validation schemas (src/lib/auth-validation.ts)

**Files:**
- Create: `src/lib/auth-validation.ts`
- Test: `src/lib/__tests__/auth-validation.test.ts`

- [ ] **Step 1: Write tests + implement**

Zod schemas for:
- `registerSchema` — email, password, displayName?
- `loginSchema` — email, password
- `resetRequestSchema` — email
- `resetPasswordSchema` — token, newPassword
- `changePasswordSchema` — currentPassword, newPassword
- `mfaVerifySchema` — challengeToken, code
- `linkEmailSchema` — email, password
- `customNameSchema` — 3-24 chars, alphanumeric + `-_. `

Tests: valid inputs, edge cases, XSS attempts, SQL injection attempts in all fields, \r\n in email, special chars, unicode, max lengths.

- [ ] **Step 2: Commit**

---

## Task 8: Email templates (src/lib/email-templates.ts)

**Files:**
- Create: `src/lib/email-templates.ts`

- [ ] **Step 1: Implement email templates**

Functions:
- `verificationEmail(userName, verifyUrl)` → { subject, html, text }
- `passwordResetEmail(userName, resetUrl)` → { subject, html, text }
- `mfaEnabledEmail(userName)` → { subject, html, text }
- `accountMergeEmail(userName, mergedIdentity)` → { subject, html, text }

All templates: plain HTML (no external resources — prevents Referer leaks), inline CSS, savecounterstrike branding.

- [ ] **Step 2: Commit**

---

## Task 9: Update NextAuth config + type declarations

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/types/next-auth.d.ts`

- [ ] **Step 1: Add email-password credentials provider**

Add second Credentials provider with id `"email-password"` alongside existing `"steam"`.

- [ ] **Step 2: Update JWT callback**

Add `securityStamp`, `authMethod`, `mfaVerified`, `email` to token claims.
Add securityStamp DB validation in jwt callback.

- [ ] **Step 3: Update session callback**

Expose new claims in session.

- [ ] **Step 4: Update type declarations**

Add new fields to `next-auth.d.ts`.

- [ ] **Step 5: Update pages.signIn**

Change from `"/"` to `"/auth/login"`.

- [ ] **Step 6: Verify build + existing tests pass**

- [ ] **Step 7: Commit**

---

## Task 10: Integration smoke test

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + new)

- [ ] **Step 2: Run build**

Run: `npx next build`
Expected: Success

- [ ] **Step 3: Run lint**

Run: `npx eslint . --quiet`
Expected: 0 errors

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: auth system foundation — utilities, schema, validation, templates"
```
