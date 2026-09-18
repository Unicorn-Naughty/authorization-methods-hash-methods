import { TProvider } from "../../application/ports/services";
import { AppError } from "../../shared";

export function isProvider(value: unknown): value is TProvider {
  return value === "vk" || value === "github" || value === "yandex";
}

export function parseOauthSession(raw: string): { provider: TProvider; codeVerifier: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("invalid oauth state", 401);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("provider" in parsed) ||
    !("codeVerifier" in parsed) ||
    !isProvider(parsed.provider) ||
    typeof parsed.codeVerifier !== "string"
  ) {
    throw new AppError("invalid oauth state", 401);
  }

  return { provider: parsed.provider, codeVerifier: parsed.codeVerifier };
}

export function readOauthCallback(query: {
  code?: unknown;
  state?: unknown;
  device_id?: unknown;
  payload?: unknown;
}) {
  let code = query.code;
  let state = query.state;
  let deviceId = query.device_id;

  if (typeof query.payload === "string") {
    try {
      const payload = JSON.parse(query.payload) as {
        code?: unknown;
        state?: unknown;
        device_id?: unknown;
      };
      if (typeof payload.code === "string") code = payload.code;
      if (typeof payload.state === "string") state = payload.state;
      if (typeof payload.device_id === "string") deviceId = payload.device_id;
    } catch {
      throw new AppError("invalid oauth callback", 400);
    }
  }

  if (typeof code !== "string" || typeof state !== "string") {
    throw new AppError("invalid oauth callback", 400);
  }

  return {
    code,
    state,
    device_id: typeof deviceId === "string" ? deviceId : undefined,
  };
}
