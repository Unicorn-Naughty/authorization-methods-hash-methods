import { IGetAccountData, IGetAccountResponse } from "../../../application/dtos";
import { AppError } from "../../../domain/errors";
import { IOauthProvider } from "../../../application/ports/services";
import {
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "../../../config/config";
import { fetchOauthJson } from "./http";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

export class GoogleOauthService implements IOauthProvider {
  getRedirectUrl(state: string, code_challenge: string): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge,
      code_challenge_method: "S256",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getAccount(data: IGetAccountData): Promise<IGetAccountResponse> {
    const { ok, json } = await fetchOauthJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: data.code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
        code_verifier: data.code_verifier,
      }),
    });

    const tokens = json as GoogleTokenResponse;

    if (!ok || !tokens.access_token) {
      throw new AppError("google token exchange failed", 401);
    }

    const userResult = await fetchOauthJson("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const user = userResult.json as GoogleUserResponse;

    if (!userResult.ok || !user.sub || !user.email || user.email_verified !== true) {
      throw new AppError("google email is missing", 400);
    }

    return {
      provider: "google",
      provider_account_id: user.sub,
      email: user.email,
      email_verified: true,
    };
  }
}
