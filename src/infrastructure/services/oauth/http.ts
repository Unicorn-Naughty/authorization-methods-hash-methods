import { OAUTH_FETCH_TIMEOUT_MS } from "../../../config/config";
import { AppError } from "../../../domain/errors";

export async function fetchOauthJson(
  url: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; json: unknown }> {
  let res: Response;

  try {
    res = await fetch(url, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new AppError("oauth provider unavailable", 502);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new AppError("invalid oauth response", 502);
  }

  return { ok: res.ok, json };
}
