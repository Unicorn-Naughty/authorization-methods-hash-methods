function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env ${name}`);
  }
  return value;
}

export const JWT_ACCESS_SECRET = required("JWT_ACCESS_SECRET");
export const JWT_REFRESH_SECRET = required("JWT_REFRESH_SECRET");

export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
export const ACCESS_TOKEN_EXPIRES_IN = "15m" as const;
export const REFRESH_TOKEN_EXPIRES_IN = "7d" as const;
export const OAUTH_STATE_TTL_SECONDS = 600;
export const OAUTH_FETCH_TIMEOUT_MS = 10_000;

export const GITHUB_CLIENT_ID = required("GITHUB_CLIENT_ID");
export const GITHUB_CLIENT_SECRET = required("GITHUB_CLIENT_SECRET");
export const GITHUB_CALLBACK_URL = required("GITHUB_CALLBACK_URL");
export const VK_ID = required("VK_ID");
export const VK_SERVICE_KEY = required("VK_SERVICE_KEY");
export const VK_CALLBACK_URL = required("VK_CALLBACK_URL");

export const GOOGLE_CLIENT_ID = required("GOOGLE_CLIENT_ID");
export const GOOGLE_CLIENT_SECRET = required("GOOGLE_CLIENT_SECRET");
export const GOOGLE_CALLBACK_URL = required("GOOGLE_CALLBACK_URL");

const defaultOrigins = "http://localhost:5173,https://localhost:5173";

export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? defaultOrigins)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
