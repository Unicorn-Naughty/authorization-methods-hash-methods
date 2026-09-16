import {
  IGetAccountData,
  IGetAccountResponse,
  IGithubOauthEmailsRes,
  IGithubOauthTokenRes,
  IGithubOauthUserRes,
} from "../../../application/dtos";
import { IOauth } from "../../../application/ports/services";
import {
  GITHUB_CALLBACK_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from "../../../config/config";
import { AppError } from "../../../shared";

export class GithubOauthService implements IOauth {
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

    const res = await fetch(`https://github.com/login/oauth/access_token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body,
    });

    const tokenJson = (await res.json()) as IGithubOauthTokenRes;

    if (!res.ok || !tokenJson.access_token) throw new AppError("github token ex failed", 401);

    const githubHeaders = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenJson.access_token}`,
      "User-Agent": "learn-api",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const userRes = await fetch("https://api.github.com/user", { headers: githubHeaders });

    const user = (await userRes.json()) as IGithubOauthUserRes;

    if (!userRes.ok) {
      throw new AppError("GitHub user request failed", 401);
    }

    let email = user.email;

    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: githubHeaders,
      });

      const emails = (await emailsRes.json()) as Array<IGithubOauthEmailsRes>;

      if (!emailsRes.ok) {
        throw new AppError("GitHub email request failed", 401);
      }

      const chosen =
        emails.find((item) => item.primary && item.verified) ??
        emails.find((item) => item.verified);

      email = chosen?.email ?? null;
    }

    if (!email) {
      throw new AppError("GitHub email is missing", 400);
    }

    return {
      provider: "github",
      provider_account_id: String(user.id),
      email,
    };
  }
}
