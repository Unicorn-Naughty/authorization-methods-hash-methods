import { ITokenService } from "../../application/ports/services";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../../config/config";
import type { RedisClient } from "../db/redis.client";

export class TokenService implements ITokenService {
  constructor(private redis: RedisClient) {}
  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
  }
  async generateRefreshToken(userId: string): Promise<string> {
    const token = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    await this.redis.set(`refresh_token:${userId}`, token, { EX: 7 * 24 * 60 * 60 });
    return token;
  }
  verifyAccessToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET) as jwt.JwtPayload & { userId: string };
      return payload.userId;
    } catch {
      return null;
    }
  }
  async verifyRefreshToken(token: string): Promise<string | null> {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload & { userId: string };
      const redisToken = await this.redis.get(`refresh_token:${payload.userId}`);
      if (token !== redisToken) return null;
      return payload.userId;
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload & { userId: string };
      await this.redis.del(`refresh_token:${payload.userId}`);
    } catch {
      // logout is best-effort: ignore invalid/expired tokens
    }
  }
}
