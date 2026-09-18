import {
  IGetAccountResponse,
  IGetVKAccountData,
  IGetVKAccountResponse,
  IGetVKAccountUserResponse,
} from "../../../application/dtos";
import { IOauthService } from "../../../application/ports/services";
import { VK_CALLBACK_URL, VK_ID, VK_SERVICE_KEY } from "../../../config/config";
import { AppError } from "../../../shared";

type VkErrorBody = {
  error: string;
  error_description?: string;
};

function isVkError(data: unknown): data is VkErrorBody {
  return (
    typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
  );
}

async function postForm(url: string, body: URLSearchParams): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new AppError("invalid vk response", 502);
  }

  if (isVkError(json)) {
    throw new AppError(json.error_description ?? json.error, 401);
  }

  if (!res.ok) {
    throw new AppError("vk oauth failed", 401);
  }

  return json;
}

export class VKOuathService implements IOauthService {
  getRedirectUrl(state: string, code_challenge: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: VK_ID,
      redirect_uri: VK_CALLBACK_URL,
      state,
      code_challenge,
      code_challenge_method: "S256",
      scope: "email",
    });
    return `https://id.vk.ru/authorize?${params.toString()}`;
  }

  async getAccount(data: IGetVKAccountData): Promise<IGetAccountResponse> {
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code_verifier: data.code_verifier,
      redirect_uri: VK_CALLBACK_URL,
      code: data.code,
      client_id: VK_ID,
      device_id: data.device_id,
      state: data.state,
      service_token: VK_SERVICE_KEY,
    });

    const tokenJson = (await postForm(
      "https://id.vk.ru/oauth2/auth",
      tokenBody,
    )) as IGetVKAccountResponse;

    if (!tokenJson.access_token || tokenJson.user_id == null) {
      throw new AppError("vk oauth failed", 401);
    }

    if (tokenJson.state && tokenJson.state !== data.state) {
      throw new AppError("invalid vk oauth state", 401);
    }

    const userBody = new URLSearchParams({
      client_id: VK_ID,
      access_token: tokenJson.access_token,
    });

    const userJson = (await postForm(
      "https://id.vk.ru/oauth2/user_info",
      userBody,
    )) as IGetVKAccountUserResponse;

    if (!userJson.user?.email) {
      throw new AppError("vk email is missing", 400);
    }

    return {
      email: userJson.user.email,
      provider: "vk",
      provider_account_id: String(tokenJson.user_id),
    };
  }
}
