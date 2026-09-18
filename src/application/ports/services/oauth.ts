import { IGetAccountData, IGetAccountResponse, IGetVKAccountData } from "../../dtos";

export type TProvider = "vk" | "github" | "yandex";

export enum Provider {
  VK = "vk",
  GH = "github",
  YAN = "yandex",
}

export interface IOauthService {
  getRedirectUrl(state: string, code_challenge: string, provider?: TProvider): string;
  getAccount(
    data: IGetAccountData | IGetVKAccountData,
    provider?: TProvider,
  ): Promise<IGetAccountResponse>;
}
