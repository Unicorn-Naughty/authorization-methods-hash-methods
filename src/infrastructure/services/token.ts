import { ITokenPair } from "../../application/dtos";
import { IRotatedRefreshToken, ITokenService } from "../../application/ports/services";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TTL_SECONDS,
} from "../../config/config";
import type { RedisClient } from "../db/redis.client";

const JWT_ALG = "HS256" as const;

type RefreshJwtPayload = jwt.JwtPayload & {
  user_id?: string;
  jti?: string;
  familyId?: string;
};

const refreshKey = (user_id: string, jti: string) => `refresh_token:${user_id}:${jti}`;
const familyKey = (user_id: string, familyId: string) => `family:${user_id}:${familyId}`;

const ROTATE_SCRIPT = `
local familyId = ARGV[1]
local oldJti = ARGV[2]
local newJti = ARGV[3]
local ttl = ARGV[4]
local refreshPrefix = ARGV[5]
local graceTtl = ARGV[6]
local activeJti = redis.call('GET', KEYS[2])
if activeJti == false then
  return 'missing'
end
if activeJti ~= oldJti then
  local graceFamily = redis.call('GET', KEYS[1])
  if graceFamily ~= false and graceFamily == familyId then
    return { 'grace', activeJti }
  end
  redis.call('DEL', KEYS[2])
  redis.call('DEL', refreshPrefix .. activeJti)
  redis.call('DEL', KEYS[1])
  return 'reuse'
end
local storedFamily = redis.call('GET', KEYS[1])
if storedFamily == false or storedFamily ~= familyId then
  return 'missing'
end
redis.call('SET', KEYS[1], familyId, 'EX', graceTtl)
redis.call('SET', KEYS[3], familyId, 'EX', ttl)
redis.call('SET', KEYS[2], newJti, 'EX', ttl)
return 'ok'
`;

export class TokenService implements ITokenService {
  constructor(private redis: RedisClient) {}

  generateAccessToken(user_id: string): string {
    return jwt.sign({ user_id }, JWT_ACCESS_SECRET, {
      algorithm: JWT_ALG,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  async generateRefreshToken(user_id: string, jti: string, familyId: string): Promise<string> {
    const token = jwt.sign({ user_id, jti, familyId }, JWT_REFRESH_SECRET, {
      algorithm: JWT_ALG,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    await this.redis.set(refreshKey(user_id, jti), familyId, { EX: REFRESH_TTL_SECONDS });
    await this.redis.set(familyKey(user_id, familyId), jti, { EX: REFRESH_TTL_SECONDS });

    return token;
  }

  async issueTokenPair(user_id: string): Promise<ITokenPair> {
    const familyId = crypto.randomUUID();
    const jti = crypto.randomUUID();

    return {
      accessToken: this.generateAccessToken(user_id),
      refreshToken: await this.generateRefreshToken(user_id, jti, familyId),
    };
  }

  async rotateRefreshToken(token: string): Promise<IRotatedRefreshToken | null> {
    let payload: RefreshJwtPayload;

    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: [JWT_ALG] }) as RefreshJwtPayload;
    } catch {
      return null;
    }

    const { user_id, jti: oldJti, familyId } = payload;

    if (!user_id || !oldJti || !familyId) return null;

    const newJti = crypto.randomUUID();

    const result = await this.redis.eval(ROTATE_SCRIPT, {
      keys: [
        refreshKey(user_id, oldJti),
        familyKey(user_id, familyId),
        refreshKey(user_id, newJti),
      ],
      arguments: [
        familyId,
        oldJti,
        newJti,
        String(REFRESH_TTL_SECONDS),
        `refresh_token:${user_id}:`,
        "10",
      ],
    });

    let jtiForToken: string | undefined;
    if (result === "ok") {
      jtiForToken = newJti;
    } else if (Array.isArray(result) && result[0] === "grace" && typeof result[1] === "string") {
      jtiForToken = result[1];
    } else {
      return null;
    }

    const newToken = jwt.sign({ user_id, jti: jtiForToken, familyId }, JWT_REFRESH_SECRET, {
      algorithm: JWT_ALG,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    return { refreshToken: newToken, user_id };
  }

  verifyAccessToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: [JWT_ALG] }) as RefreshJwtPayload;
      return payload.user_id ?? null;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ user_id: string; familyId: string; jti: string } | null> {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        algorithms: [JWT_ALG],
      }) as RefreshJwtPayload;

      if (!payload.jti || !payload.user_id || !payload.familyId) return null;

      const storedFamily = await this.redis.get(refreshKey(payload.user_id, payload.jti));
      const storedJti = await this.redis.get(familyKey(payload.user_id, payload.familyId));

      if (storedJti !== payload.jti || storedFamily !== payload.familyId) return null;

      return { user_id: payload.user_id, familyId: payload.familyId, jti: payload.jti };
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        algorithms: [JWT_ALG],
      }) as RefreshJwtPayload;

      if (!payload.user_id || !payload.jti || !payload.familyId) return;

      await this.redis.del(refreshKey(payload.user_id, payload.jti));
      await this.redis.del(familyKey(payload.user_id, payload.familyId));
    } catch {
      // logout is best-effort: ignore invalid/expired tokens
    }
  }
}
