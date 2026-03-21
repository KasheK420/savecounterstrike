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
  content: z.string().min(10).max(5000),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});
