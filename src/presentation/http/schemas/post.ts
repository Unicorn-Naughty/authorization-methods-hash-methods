import { z } from "zod";

export const createRules = z.object({
  title: z.string().min(5).max(100),
  text: z.string().min(90).max(1000),
});

export const updateRules = z
  .object({
    title: z.string().min(5).max(100).optional(),
    text: z.string().min(90).max(1000).optional(),
  })
  .refine((data) => data.title !== undefined || data.text !== undefined, {
    message: "title or text is required",
  });

export const listPostsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
