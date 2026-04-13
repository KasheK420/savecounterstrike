/**
 * @fileoverview Minimal JWT sign/verify utilities (HS256).
 *
 * Avoids adding `jsonwebtoken` as a dependency by using Node.js
 * crypto directly. Only supports HS256 which is sufficient for
 * short-lived MFA challenge tokens and merge confirmation tokens.
 *
 * @module jwt
 */

import { createHmac } from "crypto";
import { timingSafeCompare } from "./timing";

/**
 * Sign a JWT payload with HS256.
 *
 * @param payload - Claims to include in the token
 * @param secret  - HMAC secret (e.g., AUTH_SECRET)
 * @param expiresInSec - Token lifetime in seconds
 * @returns Encoded JWT string (header.payload.signature)
 */
export function signJwt(
  payload: object,
  secret: string,
  expiresInSec: number,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");

  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    }),
  ).toString("base64url");

  const sig = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${sig}`;
}

/**
 * Verify and decode a JWT signed with HS256.
 *
 * @param token  - Encoded JWT string
 * @param secret - HMAC secret used during signing
 * @returns Decoded payload or null if invalid/expired
 */
export function verifyJwt<T>(token: string, secret: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;

  const expected = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (!timingSafeCompare(sig, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as T;
  } catch {
    return null;
  }
}
