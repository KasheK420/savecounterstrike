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

export function generateMfaChallengeNonce(): string {
  return randomBytes(32).toString("hex");
}
