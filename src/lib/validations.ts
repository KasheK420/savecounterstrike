/**
 * @fileoverview Zod validation schemas for all user input.
 *
 * Centralized validation definitions for forms, API routes, and database operations.
 * All schemas enforce strict type checking and length limits.
 *
 * @module validations
 * @see {@link https://zod.dev|Zod Documentation}
 */

import { z } from "zod";

// ── Petition & Signatures ───────────────────────────────────

/** Schema for petition signature with optional message */
export const petitionSignSchema = z.object({
  message: z
    .string()
    .max(500, "Message must be 500 characters or less")
    .optional()
    .transform((val) => val?.trim() || undefined),
});

// ── Media & Opinions ────────────────────────────────────────

/** Schema for media submission (video clips, screenshots) */
export const mediaSubmitSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(1000).optional().transform((v) => v?.trim() || undefined),
});

/** Schema for opinion/blog post creation */
export const opinionSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(50000),
  imageUrl: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
  tags: z.array(z.string().max(50)).max(5).default([]),
});

// ── Comments ─────────────────────────────────────────────────

/**
 * Schema for comments on opinions or media.
 * Validates that exactly one of opinionId or mediaId is provided (XOR check).
 */
export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(), // For nested replies
  opinionId: z.string().optional(), // Target: opinion post
  mediaId: z.string().optional(), // Target: media item
  isAnonymous: z.boolean().optional().default(false),
}).refine(
  // XOR: exactly one of opinionId or mediaId must be set
  (data) => Boolean(data.opinionId) !== Boolean(data.mediaId),
  { message: "Exactly one of opinionId or mediaId must be provided" }
);

// ── Contact Form ─────────────────────────────────────────────

/** Schema for contact form submissions */
export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Must be a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

// ── Ko-fi Supporters (Bot API) ────────────────────────────

/** Schema for bot → web supporter registration */
export const supporterRegisterSchema = z.object({
  discordId: z.string().min(1, "Discord ID is required"),
  steamId: z.string().regex(/^\d{17}$/, "Must be a valid 17-digit Steam ID"),
  displayName: z.string().min(1).max(64),
  avatarUrl: z.string().url().optional(),
  tier: z.string().min(1),
  tierLevel: z.coerce.number().int().min(1).max(10),
  customMessage: z
    .string()
    .max(200)
    .optional()
    .transform((v) => v?.trim() || undefined),
});

/** Schema for bot → web supporter deactivation */
export const supporterDeactivateSchema = z.object({
  discordId: z.string().min(1, "Discord ID is required"),
});

// ── Articles (Admin) ───────────────────────────────────────

/** Schema for blog article creation/editing (admin only) */
export const articleSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    // SEO-friendly slugs: lowercase, alphanumeric with hyphens
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().max(500).optional().transform((v) => v?.trim() || undefined),
  content: z.string().min(10),
  coverImage: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).default([]),
});
