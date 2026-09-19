import { IOauthSessionStore } from "../../../application/ports/services";
import type { RedisClient } from "../../db/redis.client";

const sessionKey = (state: string) => `oauth:state:${state}`;

export class RedisOauthSessionStore implements IOauthSessionStore {
  constructor(private readonly redis: RedisClient) {}

  async save(state: string, payload: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(sessionKey(state), payload, {
      expiration: { type: "EX", value: ttlSeconds },
    });
  }

  async consume(state: string): Promise<string | null> {
    return this.redis.GETDEL(sessionKey(state));
  }
}
