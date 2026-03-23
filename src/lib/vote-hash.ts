/**
 * @fileoverview IP-based vote identity hashing for anonymous voting.
 *
 * Generates a SHA-256 hash from client IP + salt so that anonymous voters
 * can be deduplicated without storing raw IPs. Used only when the voter
 * is not authenticated (no userId).
 *
 * @module vote-hash
 */

import crypto from "crypto";
import { getClientIp } from "./rate-limit";

/**
 * Generate a SHA-256 hash of the client IP combined with a server-side salt.
 * This allows deduplication of anonymous votes without storing raw IP addresses.
 *
 * @param request - Incoming request object
 * @returns Hex-encoded SHA-256 hash string
 */
export function getVoteIpHash(request: Request): string {
  const ip = getClientIp(request);
  const salt = process.env.VOTE_SALT || "default-vote-salt-change-me";
  return crypto.createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}
