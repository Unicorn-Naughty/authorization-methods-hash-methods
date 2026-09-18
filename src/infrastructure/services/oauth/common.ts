import { IGetAccountData, IGetVKAccountData, IGetAccountResponse } from "../../../application/dtos";
import { IOauthService, Provider, TProvider } from "../../../application/ports/services";
import { AppError } from "../../../shared";
import { GithubOauthService } from "./github";
import { VKOuathService } from "./vk";

export class CommonOauthService implements IOauthService {
  constructor(
    private githubService: GithubOauthService,
    private vkService: VKOuathService,
  ) {}

  getRedirectUrl(state: string, code_challenge: string, provider: TProvider): string {
    switch (provider) {
      case Provider.VK:
        return this.vkService.getRedirectUrl(state, code_challenge);
      case Provider.GH:
        return this.githubService.getRedirectUrl(state, code_challenge);
      default:
        throw new AppError("failed", 500);
    }
  }

  getAccount(
    data: IGetAccountData | IGetVKAccountData,
    provider: TProvider,
  ): Promise<IGetAccountResponse> {
    switch (provider) {
      case Provider.VK:
        return this.vkService.getAccount(data as IGetVKAccountData);
      case Provider.GH:
        return this.githubService.getAccount(data as IGetAccountData);
      default:
        throw new AppError("failed", 500);
    }
  }
}
