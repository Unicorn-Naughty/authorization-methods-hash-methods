import { z } from "zod";
import { Provider } from "../../../application/ports/services";

export const credentialsRules = z.object({
  email: z.email(),
  password: z.string().min(10).max(50),
});

export const oauthLoginRules = z.object({
  provider: z.enum(Provider),
});

export const oauthCallbackQuery = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
  code: z.string().optional(),
  state: z.string().optional(),
  device_id: z.string().optional(),
  payload: z.string().optional(),
});
