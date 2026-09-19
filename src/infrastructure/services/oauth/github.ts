import { IGetAccountData, IGetAccountResponse } from "../../../application/dtos";
import { IOauthProvider } from "../../../application/ports/services";
import { AppError } from "../../../domain/errors";
import {
  GITHUB_CALLBACK_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from "../../../config/config";
import { IGithubOauthEmailsRes, IGithubOauthTokenRes, IGithubOauthUserRes } from "../../types";
import { fetchOauthJson } from "./http";

export class GithubOauthService implements IOauthProvider {
  getRedirectUrl(state: string, code_challenge: string): string {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
      state,
      code_challenge,
      code_challenge_method: "S256",
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async getAccount(data: IGetAccountData): Promise<IGetAccountResponse> {
    const body = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: data.code,
      redirect_uri: GITHUB_CALLBACK_URL,
      code_verifier: data.code_verifier,
    });

    const { ok, json } = await fetchOauthJson("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });

    const tokenJson = json as IGithubOauthTokenRes;

    if (!ok || !tokenJson.access_token) throw new AppError("github token exchange failed", 401);

    const githubHeaders = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenJson.access_token}`,
      "User-Agent": "learn-api",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const userResult = await fetchOauthJson("https://api.github.com/user", {
      headers: githubHeaders,
    });

    const user = userResult.json as IGithubOauthUserRes;

    if (!userResult.ok) {
      throw new AppError("GitHub user request failed", 401);
    }

    const emailsResult = await fetchOauthJson("https://api.github.com/user/emails", {
      headers: githubHeaders,
    });

    const emails = emailsResult.json as Array<IGithubOauthEmailsRes>;

    if (!emailsResult.ok || !Array.isArray(emails)) {
      throw new AppError("GitHub email request failed", 401);
    }

    const chosen =
      emails.find((item) => item.primary && item.verified) ??
      emails.find((item) => item.verified);

    if (!chosen?.email) {
      throw new AppError("GitHub email is missing", 400);
    }

    return {
      provider: "github",
      provider_account_id: String(user.id),
      email: chosen.email,
      email_verified: true,
    };
  }
}
