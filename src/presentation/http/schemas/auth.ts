import { z } from "zod";

export const credentialsRules = z.object({
  email: z.email(),
  password: z.string().min(10).max(50),
});
