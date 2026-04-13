# Auth System Design Spec — SaveCounterStrike

> **Revision 2** — incorporates architecture and security review findings.

## Overview

Add email/password registration and login alongside existing Steam OpenID authentication. Both paths are equal — users can register via email or Steam, and link the other method later. Includes password reset, email verification, TOTP MFA (mandatory for admins/mods), and account merging with dual-party authorization.

**Architecture:** Hybrid — NextAuth handles providers and JWT sessions. Custom middleware enforces MFA. Password reset and email verification are standalone subsystems. Account lockout uses DB-backed `LoginAttempt` table (not in-memory) for persistence across restarts.

---

## 1. Data Model

### 1.1 User Model Changes

```prisma
model User {
  id          String   @id @default(cuid())

  // Identity — at least one must be set (app-level validation)
  steamId     String?  @unique          // Was required, now optional
  email       String?  @unique          // NEW — for email/password auth

  // Auth
  passwordHash     String?             // bcrypt(12 rounds), null for Steam-only
  emailVerified    Boolean  @default(false)
  emailVerifiedAt  DateTime?
  securityStamp    String   @default(cuid())  // Rotated on password/MFA/role change → invalidates JWTs

  // MFA
  mfaEnabled       Boolean  @default(false)
  mfaSecret        String?             // AES-256-GCM encrypted TOTP secret (format: v1:iv:ciphertext:authTag)
  lastTotpStep     Int?                // Last accepted TOTP time-step (replay protection)

  // MFA setup (pending, not yet confirmed)
  pendingMfaSecret    String?          // Encrypted, cleared after confirm or 10 min TTL
  pendingMfaExpiresAt DateTime?        // TTL for incomplete MFA setup

  // Existing fields remain unchanged:
  displayName String
  avatarUrl   String?
  profileUrl  String?
  role        Role     @default(USER)
  customName  String?  @db.VarChar(32)
  bio         String?  @db.VarChar(500)
  karma       Int      @default(0)
  // ... all other existing fields (stats, bans, etc.) ...

  // NEW relations
  passwordResetTokens  PasswordResetToken[]
  emailVerifyTokens    EmailVerifyToken[]
  loginAttempts        LoginAttempt[]
  mfaRecoveryCodes     MfaRecoveryCode[]
}
```

### 1.2 New Tables

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique   // SHA-256 of raw token
  expiresAt DateTime            // 30 minutes from creation
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model EmailVerifyToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique   // SHA-256 of raw token
  expiresAt DateTime            // 24 hours from creation
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])     // For cleanup queries
}

model MfaRecoveryCode {
  id        String   @id @default(cuid())
  userId    String
  codeHash  String                      // bcrypt hash of recovery code
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum AuthMethod {
  EMAIL
  STEAM
  MFA
}

model LoginAttempt {
  id        String     @id @default(cuid())
  userId    String?
  ipHash    String
  userAgent String?                     // Hashed for fingerprinting
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
  action    String                      // "account_merge", "mfa_enable", "role_change", etc.
  details   Json?
  ipHash    String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action, createdAt])
}
```

### 1.3 Migration Strategy

- `steamId` changes from required to optional — `ALTER COLUMN DROP NOT NULL`
- Existing users unaffected — all have steamId set
- New `securityStamp` column added with default `cuid()` — auto-populated for existing rows
- New email-only users will have `steamId: null`
- App-level constraint: `if (!user.steamId && !user.email) throw`

---

## 2. Auth Flows

### 2.1 Email Registration

```
POST /api/auth/register
  Body: { email, password, displayName? }

  1. Validate email (Zod, RFC 5322, reject \r\n for header injection)
  2. Validate password:
     a. Min 12 chars, max 72 bytes (bcrypt limit), uppercase + lowercase + digit + special char
     b. Check against HaveIBeenPwned API (k-anonymity, first 5 chars of SHA-1)
        - Timeout: 3 seconds
        - On API failure: allow registration, log warning, flag for deferred re-check
  3. Check email uniqueness
     - If email exists: return SAME 200 response as success (anti-enumeration)
     - Do NOT reveal that email is taken
  4. Hash password (bcrypt, 12 rounds via bcryptjs)
  5. Create User with emailVerified=false
  6. Generate verify token → SHA-256 hash to DB, raw token in email
  7. Send verification email
  8. Return 200 { message: "Check your email to verify your account" }
     - Do NOT create session — user must verify email first, then login

  Rate limit: 5 per hour per IP
  CSRF: Origin header validation (Content-Type: application/json enforces CORS preflight)
```

### 2.2 Email Login

```
POST /api/auth/login
  Body: { email, password }

  1. Find user by email
     - If not found: do fake bcrypt.compare (constant-time) → return generic error
  2. Check account lockout via DB:
     SELECT COUNT(*) FROM LoginAttempt
     WHERE userId = ? AND success = false AND createdAt > NOW() - 15min
     - If >= 5 → return "Account temporarily locked"
  3. Check emailVerified — if false, return "Please verify your email first"
  4. Verify bcrypt hash
  5. Log LoginAttempt (success or fail) to DB
  6. If MFA enabled:
     a. Generate MFA challenge nonce → store in HttpOnly cookie (mfa_challenge_nonce)
     b. Create MFA challenge JWT (5 min): { userId, nonceHash: SHA-256(nonce), ipHash }
     c. Return { mfaRequired: true, challengeToken }
  7. If MFA not enabled:
     a. signIn("email-password", ...) → session cookie
     b. Return 200

  Rate limit: 10 per 15 min per IP (in-memory, acceptable for non-critical)
  Account lockout: DB-backed, 5 failures per userId in 15 min → 15 min cooldown
```

### 2.3 MFA Challenge

```
POST /api/auth/mfa/verify
  Body: { challengeToken, code }

  1. Verify challenge JWT (signature + expiry)
  2. Extract userId, nonceHash, ipHash from JWT
  3. Validate binding:
     a. Read mfa_challenge_nonce cookie → SHA-256 → must match nonceHash
     b. Hash request IP → must match ipHash
  4. Verify TOTP code against decrypted mfaSecret
     - Accept window: ±1 time step (30 sec each side)
     - Replay check: reject if code's time-step <= user.lastTotpStep
     - On success: update user.lastTotpStep
  5. If TOTP invalid, try recovery codes:
     - bcrypt.compare against each unused MfaRecoveryCode
     - If match: mark code as used (set usedAt)
  6. Log LoginAttempt (method: MFA)
  7. Delete mfa_challenge_nonce cookie
  8. signIn("email-password", ...) → session cookie
  9. Return 200

  Rate limit: 5 attempts per challenge JWT (tracked by JWT jti claim)
```

### 2.4 Steam Login (existing, modified)

```
GET /api/auth/steam/login → unchanged
GET /api/auth/steam/callback → modified:

  After Steam verification:
  1. Check if User exists with this steamId
  2. If not exists → create User with steamId, no email/password
  3. If user.isBanned → redirect /?error=account_banned
  4. If user.mfaEnabled:
     a. Do NOT call signIn() yet
     b. Generate MFA challenge token (same as 2.2 step 6)
     c. Set mfa_challenge_nonce cookie
     d. Redirect to /auth/mfa?challenge=<token>
  5. If MFA not enabled:
     a. signIn("steam", ...) → session cookie
     b. Redirect to home
```

### 2.5 Password Reset

```
POST /api/auth/forgot-password
  Body: { email }

  1. Always return 200 (anti-enumeration)
  2. Find user by email — if not found, do nothing (but same response time)
  3. Invalidate all existing reset tokens for this user (set usedAt = now)
  4. Generate crypto.randomBytes(32) token
  5. Store SHA-256(token) in DB with 30 min expiry
  6. Send email with reset link: /auth/reset-password?token=<raw>
     - Reset page must have Referrer-Policy: no-referrer
     - Client-side: history.replaceState to clear token from URL after reading

  Rate limit: 3 per hour per IP AND per email

POST /api/auth/reset-password
  Body: { token, newPassword }

  1. SHA-256 hash the token, find in DB
  2. Check not expired, not used
  3. Validate new password (same rules as registration, including HIBP)
  4. Update user's passwordHash
  5. Mark token as used
  6. Invalidate all other reset tokens for user
  7. Regenerate user.securityStamp → all existing JWTs become invalid
  8. Return 200 + redirect to login

  Rate limit: 5 per hour per IP
```

### 2.6 Email Verification

```
GET /api/auth/verify-email?token=<raw>

  1. SHA-256 hash, find in DB
  2. Check not expired (24h), not used
  3. Set user.emailVerified = true, emailVerifiedAt = now
  4. Mark token as used
  5. Redirect to /auth/login with success message

POST /api/auth/resend-verification
  (authenticated)

  1. Check user has email and !emailVerified
  2. Invalidate old tokens
  3. Generate new token, send email

  Rate limit: 3 per hour per user
```

### 2.7 Change Password (authenticated)

```
POST /api/auth/change-password
  Body: { currentPassword, newPassword }
  (authenticated, emailVerified required)

  1. Verify currentPassword against user.passwordHash
  2. Validate newPassword (same rules, HIBP check)
  3. Hash and update passwordHash
  4. Regenerate securityStamp → invalidates all other sessions
  5. Re-issue current session JWT with new securityStamp
  6. Return 200

  Rate limit: 5 per hour per userId
```

---

## 3. Account Linking & Merging

### 3.1 Link Steam to Email Account

```
GET /api/auth/link/steam (authenticated, from profile page)

  1. User is logged in with email account
  2. Redirect to Steam OpenID flow (separate callback URL: /api/auth/link/steam/callback)
  3. On callback:
     a. If steamId not linked to any account → set user.steamId, fetch profile/stats
     b. If linked to another account → initiate merge confirmation flow

  Rate limit: 5 per hour per userId
```

### 3.2 Link Email to Steam Account

```
POST /api/auth/link/email
  Body: { email, password }
  (authenticated, Steam user)

  1. Validate email + password (same rules as registration)
  2. If email not used → set user.email, user.passwordHash, send verify email
  3. If email exists on another account → initiate merge confirmation flow

  Rate limit: 5 per hour per userId
```

### 3.3 Merge Confirmation Flow

```
When linking detects a conflicting account:

  1. Generate merge confirmation token (JWT, 10 min)
  2. Show user a confirmation page:
     "This Steam/email belongs to another account with:
      - X opinions, Y comments, Z votes
      - Role: [role]
      - Do you want to merge this account into yours?"
  3. User must re-authenticate the OTHER account to prove ownership:
     - If merging Steam account → must complete Steam login
     - If merging email account → must enter that account's password
  4. Only after dual-party auth → proceed with merge

POST /api/auth/merge/confirm
  Body: { mergeToken, proof }    // proof = password or Steam callback state

  Validation before merge:
  1. Neither account is banned (refuse merge if either is banned)
  2. Role handling: KEEP current user's role (never escalate from merged account)
  3. If merged account has higher role → log to AuditLog, require admin approval
```

### 3.4 Account Merge Logic

```typescript
// src/lib/account-merge.ts
async function mergeAccounts(keepUserId: string, mergeUserId: string)

  Pre-checks:
  - If mergeUser.isBanned → REFUSE merge (log attempt)
  - If mergeUser.role > keepUser.role → REFUSE (requires admin approval)

  Transaction:
  1. Transfer all relations from mergeUser → keepUser:
     - PetitionSignature:
       - If keepUser has signature → delete mergeUser's signature
       - If only mergeUser has signature → update userId to keepUser
       - Handle @@unique([steamId]) constraint
     - Opinions (update authorId)
     - Comments (update authorId)
     - OpinionVotes (update userId, ON CONFLICT skip duplicates)
     - CommentVotes (update userId, ON CONFLICT skip duplicates)
     - Media (update authorId)
     - MediaVotes (update userId, ON CONFLICT skip duplicates)
     - PageView (update userId where userId = mergeUserId)
     - LoginAttempt (update userId)
  2. Copy missing identity data:
     - If keepUser missing steamId → copy from mergeUser
     - If keepUser missing email → copy from mergeUser
     - Copy passwordHash if keepUser doesn't have one
     - Copy stats (ownsCs2, playtime, etc.) if keepUser's are null
  3. Karma: take sum (capped at max)
  4. Role: KEEP keepUser's role (never escalate)
  5. Regenerate keepUser.securityStamp
  6. Delete mergeUser (cascades handle remaining orphan relations)
  7. Log to AuditLog: { action: "account_merge", details: { keepUserId, mergeUserId, transfers } }
```

---

## 4. MFA (TOTP)

### 4.1 Setup Flow

```
POST /api/auth/mfa/setup
  (authenticated, emailVerified required OR Steam-authenticated)

  1. Generate TOTP secret (20 bytes, base32 encoded)
  2. Encrypt with AES-256-GCM (key from MFA_ENCRYPTION_KEY)
  3. Store in user.pendingMfaSecret with pendingMfaExpiresAt = now + 10 min
  4. Generate 10 recovery codes: crypto.randomBytes(8) each → 16 hex chars
  5. Return { otpauthUri, qrCodeDataUrl, recoveryCodes[] }
  6. Recovery codes shown ONCE — user must save them

POST /api/auth/mfa/confirm
  Body: { code }

  1. Check pendingMfaExpiresAt not expired
  2. Decrypt pendingMfaSecret, verify TOTP code (±1 window)
  3. If valid:
     a. Move pendingMfaSecret → mfaSecret
     b. Clear pending fields
     c. Set mfaEnabled = true
     d. Hash each recovery code (bcrypt) → create MfaRecoveryCode rows
     e. Regenerate securityStamp
  4. Return 200
```

### 4.2 Disable Flow

```
POST /api/auth/mfa/disable
  Body: { password OR recoveryCode }
  (authenticated)

  1. Reject if user.role is ADMIN or MODERATOR (MFA mandatory)
  2. Verify identity (password bcrypt check, or recovery code)
  3. Set mfaEnabled = false
  4. Clear mfaSecret, lastTotpStep, pending fields
  5. Delete all MfaRecoveryCode for user
  6. Regenerate securityStamp
  7. Log to AuditLog
  8. Return 200
```

### 4.3 MFA Gate Middleware

```typescript
// src/lib/mfa-gate.ts
// Two distinct checks:

function requireMfaCompliance(session, dbUser):
  // Check 1: Role requires MFA but not set up
  if (dbUser.role in ["ADMIN", "MODERATOR"] && !dbUser.mfaEnabled):
    redirect to /auth/mfa/setup with "MFA is required for your role"

  // Check 2: MFA is enabled but this session hasn't passed MFA
  if (dbUser.mfaEnabled && !session.mfaVerified):
    redirect to /auth/mfa with "Please complete MFA verification"
```

### 4.4 Encryption

- Algorithm: AES-256-GCM
- Key: `MFA_ENCRYPTION_KEY` env var (32 bytes, base64 encoded)
- IV: random 12 bytes per encryption
- Storage format: `v1:iv:ciphertext:authTag` (all base64, version prefix for future migration)
- Key rotation: bump version prefix, re-encrypt on next access

---

## 5. Security Architecture

### 5.1 Password Security

| Aspect | Implementation |
|--------|---------------|
| Library | `bcryptjs` (pure JS, no native compilation for Docker) |
| Rounds | 12 |
| Max input | 72 bytes (bcrypt limit, validated before hashing) |
| Breach check | HaveIBeenPwned k-anonymity API (timeout: 3s, fallback: allow + flag) |
| Policy | Min 12 chars, upper + lower + digit + special |
| Comparison | bcrypt.compare (constant-time internally) |

### 5.2 Token Security

| Token | Generation | Storage | Transmission | Expiry |
|-------|-----------|---------|-------------|--------|
| Password reset | crypto.randomBytes(32) | SHA-256 hash in DB | Raw in email link | 30 min |
| Email verify | crypto.randomBytes(32) | SHA-256 hash in DB | Raw in email link | 24 hours |
| MFA challenge | JWT (HS256), bound to IP+nonce | Not stored (stateless) | Response body + nonce cookie | 5 min |
| Recovery codes | crypto.randomBytes(8) per code | bcrypt hash in DB (individual rows) | Displayed once on setup | Single use |
| Merge confirm | JWT (HS256) | Not stored | Response body | 10 min |

### 5.3 Rate Limiting

| Endpoint | Limit | Window | Key | Backend |
|----------|-------|--------|-----|---------|
| POST /api/auth/register | 5 | 1 hour | IP | in-memory |
| POST /api/auth/login | 10 | 15 min | IP | in-memory |
| POST /api/auth/login (lockout) | 5 failures | 15 min | userId | **DB (LoginAttempt)** |
| POST /api/auth/forgot-password | 3 | 1 hour | IP + email | in-memory |
| POST /api/auth/reset-password | 5 | 1 hour | IP | in-memory |
| POST /api/auth/mfa/verify | 5 | per challenge | JWT jti | in-memory |
| POST /api/auth/resend-verification | 3 | 1 hour | userId | in-memory |
| POST /api/auth/mfa/setup | 5 | 1 hour | userId | in-memory |
| POST /api/auth/change-password | 5 | 1 hour | userId | in-memory |
| */api/auth/link/* | 5 | 1 hour | userId | in-memory |
| POST /api/auth/merge/confirm | 3 | 1 hour | userId | in-memory |

Account lockout is DB-backed (survives restarts/deploys). IP-based limits are in-memory (acceptable — non-critical, defense-in-depth).

### 5.4 Anti-Enumeration

- `/register` always returns 200 `{ message: "Check your email" }` — no session cookie, no difference
- `/forgot-password` always returns 200 regardless of email existence
- `/login` failure → generic "Invalid email or password" (never "user not found")
- Timing: fake `bcrypt.compare` on non-existent users (constant-time)
- Registration does NOT create session → no cookie-based oracle

### 5.5 Session Security

- JWT strategy (existing), 7 day max age
- New JWT claims: `authMethod: "email" | "steam"`, `mfaVerified: boolean`, `securityStamp: string`
- **securityStamp validation**: On every authenticated request, the `jwt` callback compares `token.securityStamp` against `db.user.securityStamp`. If mismatch → force re-auth
- **securityStamp rotation triggers**: password change, MFA enable/disable, role change, account merge
- Session regeneration: new JWT issued after login, MFA verify, and Steam callback
- HttpOnly, Secure, SameSite=Lax cookies (existing NextAuth config)
- Update `pages.signIn` config to `"/auth/login"`

### 5.6 Input Validation

| Field | Validation |
|-------|-----------|
| email | Zod `.email()`, max 254 chars, lowercase transform, reject `\r\n` |
| password | Min 12, max 72 bytes, upper+lower+digit+special, HIBP check |
| displayName | 2-32 chars, HTML stripped, profanity filtered |
| customName | 3-24 chars, `/^[a-zA-Z0-9_\-. ]+$/`, HTML stripped |
| TOTP code | Exactly 6 digits, `/^\d{6}$/` |
| Recovery code | Exactly 16 hex chars, `/^[a-f0-9]{16}$/` |

### 5.7 CSRF Protection

Custom POST auth routes are outside NextAuth's built-in CSRF. Protection strategy:

1. All auth POST endpoints require `Content-Type: application/json`
2. This triggers CORS preflight on cross-origin requests → browser blocks without server CORS headers
3. Additionally: validate `Origin` header matches `NEXT_PUBLIC_SITE_URL` on all auth POST routes
4. Steam flows use existing state cookie pattern

### 5.8 Zero Trust Principles

- Every API route re-validates session from DB (existing pattern via requireActiveUser)
- securityStamp in JWT validated against DB on every request
- MFA gate: two distinct checks (setup required vs. verification required)
- Tokens never reusable — marked `usedAt` on consumption
- Account merge: dual-party authorization, ban check, no role escalation
- TOTP secrets encrypted at rest, decrypted only during verification
- TOTP replay protection via lastTotpStep
- No secrets in logs — all error messages are generic
- MFA challenge JWT bound to client (IP + HttpOnly nonce cookie)

---

## 6. API Routes

### New Routes

```
# Registration & Login
POST   /api/auth/register              # Email registration (returns 200, no session)
POST   /api/auth/login                 # Email login
POST   /api/auth/mfa/verify            # MFA challenge response

# Password Management
POST   /api/auth/forgot-password       # Request reset email
POST   /api/auth/reset-password        # Set new password via token
POST   /api/auth/change-password       # Change password (authenticated)

# Email Verification
GET    /api/auth/verify-email          # Click from email
POST   /api/auth/resend-verification   # Resend verification email

# MFA Management (authenticated)
POST   /api/auth/mfa/setup             # Generate TOTP secret + QR
POST   /api/auth/mfa/confirm           # Verify first code, enable MFA
POST   /api/auth/mfa/disable           # Disable MFA (not for admin/mod)

# Account Linking (authenticated)
GET    /api/auth/link/steam            # Redirect to Steam for linking
GET    /api/auth/link/steam/callback   # Steam link callback
POST   /api/auth/link/email            # Add email/password to Steam account

# Account Merging
POST   /api/auth/merge/confirm         # Confirm merge with dual-party proof
```

### Modified Routes

```
GET    /api/auth/steam/callback        # Add MFA gate (no signIn before MFA)
POST   /api/auth/signout               # Unchanged
```

---

## 7. UI Pages

```
/auth/login              # Login form (email/password + Steam button)
/auth/register           # Registration form
/auth/forgot-password    # "Enter your email" form
/auth/reset-password     # "Enter new password" form (token in URL, cleared via replaceState)
/auth/mfa               # MFA code entry during login
/auth/mfa/setup         # MFA setup wizard (QR + backup codes)
/auth/verify-email       # "Check your inbox" / verification success
/auth/merge             # Merge confirmation page (shows what will be transferred)

/user/[id]/edit          # Profile page — add sections for:
                         #   - Link Steam / Link Email
                         #   - Change password
                         #   - MFA settings (enable/disable/regenerate codes)
                         #   - Custom name
```

---

## 8. New Utility Modules

```
src/lib/password.ts        # hashPassword, verifyPassword, checkBreached (HIBP)
src/lib/mfa.ts             # generateSecret, verifyTOTP, encrypt/decrypt, recovery codes
src/lib/account-merge.ts   # mergeAccounts transaction + pre-checks
src/lib/email-templates.ts # verification, password reset, MFA alerts
src/lib/tokens.ts          # generateToken, hashToken, createResetToken, etc.
src/lib/auth-validation.ts # Zod schemas for all auth inputs
src/lib/mfa-gate.ts        # MFA compliance middleware
src/lib/csrf.ts            # Origin header validation for custom auth routes
```

---

## 9. Environment Variables (new)

```
MFA_ENCRYPTION_KEY=<base64 encoded 32 bytes>   # openssl rand -base64 32
HIBP_API_USER_AGENT=savecounterstrike           # Required by HIBP API terms
```

Existing SMTP config reused. **Deployment prerequisite**: configure SPF, DKIM, and DMARC (`p=quarantine` minimum) for the sending domain to prevent auth email spoofing.

---

## 10. Email Permissions Model

| Action | Requires identity? | Requires verified email? | Requires MFA? |
|--------|-------------------|------------------------|---------------|
| View pages | No | No | No |
| Sign petition (manual) | No | No | No |
| Sign petition (authenticated) | Steam or email | No | No |
| Post opinion | Steam or verified email | Yes (email users) | No |
| Post comment | Steam or verified email | Yes (email users) | No |
| Vote | Steam or verified email | Yes (email users) | No |
| Submit media | Steam or verified email | Yes (email users) | No |
| Change password | Email | Yes | No |
| Enable MFA | Email (verified) or Steam | Yes (email users) | No |
| Admin panel | Any | Yes (email users) | **Yes** |
| Mod actions | Any | Yes (email users) | **Yes** |

Steam = verified identity for posting purposes (risk accepted — documented). Email users must verify before write actions.

**Enforcement**: Add `requireVerifiedIdentity()` helper that checks `(user.steamId != null) || (user.emailVerified === true)`. Apply to all content mutation endpoints.

---

## 11. Migration Compatibility

- `steamId` becomes nullable — existing users unaffected
- `securityStamp` auto-populated with `@default(cuid())` for existing rows
- No data loss — only additive schema changes
- New env vars required before deploy: `MFA_ENCRYPTION_KEY`
- Old JWTs: missing `securityStamp` claim treated as "needs refresh" → force re-login on next request (one-time, graceful)
- NextAuth `pages.signIn` updated from `"/"` to `"/auth/login"`
- New dependency: `bcryptjs`, `otpauth` (TOTP library)

---

## 12. Type Declaration Updates

```typescript
// src/types/next-auth.d.ts — additions
declare module "next-auth" {
  interface Session {
    user: {
      // existing
      steamId?: string;
      role?: string;
      userId?: string;
      // new
      email?: string;
      authMethod?: "email" | "steam";
      mfaVerified?: boolean;
      securityStamp?: string;
    }
  }
}
```

---

## 13. Future Considerations (out of scope)

- Account deletion (GDPR) — separate feature, planned
- OAuth providers (Discord, Google) — extensible via NextAuth providers
- Session listing and revocation UI — planned for v2
- CAPTCHA on registration — add if spam becomes an issue
- Redis-backed rate limiting — upgrade path when scaling beyond single instance
- WebAuthn/passkeys — future MFA option alongside TOTP
