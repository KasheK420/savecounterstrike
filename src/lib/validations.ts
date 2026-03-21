import { z } from "zod";

export const petitionSignSchema = z.object({
  message: z
    .string()
    .max(500, "Message must be 500 characters or less")
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export const videoSubmitSchema = z.object({
  url: z.string().url("Must be a valid URL").refine(
    (url) => {
      return (
        url.includes("youtube.com") ||
        url.includes("youtu.be") ||
        url.includes("twitch.tv")
      );
    },
    { message: "Must be a YouTube or Twitch URL" }
  ),
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
});

export const opinionSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(50000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export const articleSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().max(500).optional().transform((v) => v?.trim() || undefined),
  content: z.string().min(10),
  coverImage: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(false),
});
