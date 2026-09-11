import { ITokenService, IRotatedRefreshToken } from "../../application/ports/services";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../../config/config";
import type { RedisClient } from "../db/redis.client";
import { JWTPayload } from "../../application/dtos";

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const refreshKey = (userId: string, jti: string) => `refresh_token:${userId}:${jti}`;
const familyKey = (userId: string, familyId: string) => `family:${userId}:${familyId}`;

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

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
  }

  async generateRefreshToken(userId: string, jti: string, familyId: string): Promise<string> {
    const token = jwt.sign({ userId, jti, familyId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    await this.redis.set(refreshKey(userId, jti), familyId, { EX: REFRESH_TTL_SECONDS });
    await this.redis.set(familyKey(userId, familyId), jti, { EX: REFRESH_TTL_SECONDS });

    return token;
  }

  async rotateRefreshToken(token: string): Promise<IRotatedRefreshToken | null> {
    let payload: jwt.JwtPayload & { userId?: string; jti?: string; familyId?: string };

    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as typeof payload;
    } catch {
      return null;
    }

    const { userId, jti: oldJti, familyId } = payload;

    if (!userId || !oldJti || !familyId) return null;

    const newJti = crypto.randomUUID();

    const result = await this.redis.eval(ROTATE_SCRIPT, {
      keys: [refreshKey(userId, oldJti), familyKey(userId, familyId), refreshKey(userId, newJti)],
      arguments: [
        familyId,
        oldJti,
        newJti,
        String(REFRESH_TTL_SECONDS),
        `refresh_token:${userId}:`,
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

    const newToken = jwt.sign({ userId, jti: jtiForToken, familyId }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return { refreshToken: newToken, userId};
  }

  verifyAccessToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload;
      return payload.userId;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ userId: string; familyId: string; jti: string } | null> {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;

      if (!payload.jti || !payload.userId || !payload.familyId) return null;

      const refreshToken = await this.redis.get(refreshKey(payload.userId, payload.jti));
      const family = await this.redis.get(familyKey(payload.userId, payload.familyId));

      if (family !== payload.jti || refreshToken !== payload.familyId) return null;

      return { userId: payload.userId, familyId: payload.familyId, jti: payload.jti };
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;

      await this.redis.del(refreshKey(payload.userId, payload.jti));
      await this.redis.del(familyKey(payload.userId, payload.familyId));
    } catch {
      // logout is best-effort: ignore invalid/expired tokens
    }
  }
}
