import type { CookieOptions, Response } from "express";
import { REFRESH_TTL_SECONDS } from "../../config/config";

export const REFRESH_COOKIE = "refreshToken";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/api/auth",
};

export function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...refreshCookieOptions,
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}
