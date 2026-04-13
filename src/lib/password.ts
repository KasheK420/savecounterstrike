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
    return false;
  }
}
