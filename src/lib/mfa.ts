import { TOTP, Secret } from "otpauth";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import bcrypt from "bcryptjs";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const TOTP_WINDOW = 1;
const RECOVERY_CODE_BYTES = 8;
const BCRYPT_ROUNDS = 12;
const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "SHA1";

/**
 * Generate a new TOTP secret and its otpauth:// URI.
 */
export function generateTotpSecret(
  issuer: string,
  accountName: string
): { secret: string; otpauthUri: string } {
  const secret = new Secret({ size: 20 });

  const totp = new TOTP({
    issuer,
    label: accountName,
    secret,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    algorithm: TOTP_ALGORITHM,
  });

  return {
    secret: secret.base32,
    otpauthUri: totp.toString(),
  };
}

/**
 * Verify a TOTP code against a base32 secret.
 *
 * Returns `{ valid: true, step }` when the code is correct and not replayed,
 * or `{ valid: false, step: null }` otherwise.
 *
 * `step` is the absolute time-step that was used, so callers can persist it
 * and pass it back as `lastStep` on the next attempt for replay protection.
 */
export function verifyTotp(
  secret: string,
  code: string,
  lastStep?: number | null
): { valid: boolean; step: number | null } {
  const totp = new TOTP({
    secret: Secret.fromBase32(secret),
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    algorithm: TOTP_ALGORITHM,
  });

  const delta = totp.validate({ token: code, window: TOTP_WINDOW });

  if (delta === null) {
    return { valid: false, step: null };
  }

  const currentStep = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  const usedStep = currentStep + delta;

  // Replay protection: reject if the same (or earlier) step was already used
  if (lastStep != null && usedStep <= lastStep) {
    return { valid: false, step: null };
  }

  return { valid: true, step: usedStep };
}

/**
 * Return the 32-byte encryption key derived from `MFA_ENCRYPTION_KEY` env var.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.MFA_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error("MFA_ENCRYPTION_KEY environment variable is not set");
  }
  const key = Buffer.from(envKey, "base64");
  if (key.length !== 32) {
    throw new Error(
      `MFA_ENCRYPTION_KEY must decode to 32 bytes, got ${key.length}`
    );
  }
  return key;
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 *
 * Output format: `v1:<iv>:<ciphertext>:<authTag>` (all segments base64).
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64"),
    encrypted.toString("base64"),
    authTag.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a string previously encrypted with `encryptSecret`.
 */
export function decryptSecret(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported encryption format");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(parts[1], "base64");
  const ciphertext = Buffer.from(parts[2], "base64");
  const authTag = Buffer.from(parts[3], "base64");

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Hash a recovery code with bcrypt.
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS);
}

/**
 * Verify a recovery code against its bcrypt hash.
 */
export async function verifyRecoveryCode(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Generate an array of cryptographically random recovery codes.
 * Each code is 16 hex characters (8 random bytes).
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(RECOVERY_CODE_BYTES).toString("hex")
  );
}
