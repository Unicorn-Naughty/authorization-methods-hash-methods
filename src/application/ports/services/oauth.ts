import { IGetAccountData, IGetAccountResponse } from "../../dtos";

export const OAUTH_PROVIDERS = ["vk", "github", "google"] as const;

export type TProvider = (typeof OAUTH_PROVIDERS)[number];

export function isProvider(value: unknown): value is TProvider {
  return typeof value === "string" && (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export interface IOauthProvider {
  getRedirectUrl(state: string, code_challenge: string): string;
  getAccount(data: IGetAccountData): Promise<IGetAccountResponse>;
}

export interface IOauthSessionStore {
  save(state: string, payload: string, ttlSeconds: number): Promise<void>;
  consume(state: string): Promise<string | null>;
}
