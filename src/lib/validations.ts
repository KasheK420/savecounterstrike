import { z } from "zod";

export const petitionSignSchema = z.object({
  message: z
    .string()
    .max(500, "Message must be 500 characters or less")
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export const mediaSubmitSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(1000).optional().transform((v) => v?.trim() || undefined),
});

export const opinionSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(50000),
  imageUrl: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
  opinionId: z.string().optional(),
  mediaId: z.string().optional(),
  isAnonymous: z.boolean().optional().default(false),
}).refine(
  (data) => Boolean(data.opinionId) !== Boolean(data.mediaId),
  { message: "Exactly one of opinionId or mediaId must be provided" }
);

export const articleSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().max(500).optional().transform((v) => v?.trim() || undefined),
  content: z.string().min(10),
  coverImage: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).default([]),
});
