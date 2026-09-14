import { z } from "zod";

export const createRules = z.object({
  title: z.string().min(5).max(100),
  text: z.string().min(90).max(1000),
});

export const updateRules = z.object({
  title: z.string().min(5).max(100).optional(),
  text: z.string().min(90).max(1000).optional(),
});
