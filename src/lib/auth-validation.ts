/**
 * @fileoverview Zod validation schemas for authentication flows.
 *
 * Covers registration, login, password reset, MFA verification,
 * account linking, and display name validation.
 *
 * @module auth-validation
 * @see {@link https://zod.dev|Zod Documentation}
 */

import { z } from "zod";

// ── Registration & Login ───────────────────────────────────

/** Schema for new user registration */
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .refine((v) => !/[\r\n]/.test(v), "Invalid characters"),
  password: z.string().min(12).max(72),
  displayName: z.string().trim().min(2).max(32).optional(),
});

/** Schema for user login */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
});

// ── Password Reset ─────────────────────────────────────────

/** Schema for requesting a password reset email */
export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

/** Schema for completing a password reset */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(12).max(72),
});

/** Schema for changing password while logged in */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(12).max(72),
});

// ── MFA ────────────────────────────────────────────────────

/** Schema for TOTP code verification */
export const mfaVerifySchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Must be exactly 6 digits"),
});

/** Schema for MFA recovery code verification */
export const mfaRecoverySchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().regex(/^[a-f0-9]{16}$/, "Must be 16 hex characters"),
});

// ── Account Linking ────────────────────────────────────────

/** Schema for linking an email/password to an OAuth account */
export const linkEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .refine((v) => !/[\r\n]/.test(v), "Invalid characters"),
  password: z.string().min(12).max(72),
});

// ── Display Name ───────────────────────────────────────────

/** Schema for custom display name */
export const customNameSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(
    /^[a-zA-Z0-9_\-. ]+$/,
    "Only letters, numbers, spaces, hyphens, underscores, and dots",
  );
