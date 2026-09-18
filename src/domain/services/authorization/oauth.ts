import { IAccountRepository, IUserRepository } from "../../../application/ports/repositories";
import { IOauthService, ITokenService, TProvider } from "../../../application/ports/services";
import { AppError } from "../../../shared";
import { IAccount, IUser, IUserWithPassword } from "../../entities";

export class OauthService {
  constructor(
    private accountRepo: IAccountRepository,
    private userRepo: IUserRepository,
    private tokenService: ITokenService,
    private oauth: IOauthService,
  ) {}

  async oauthLogin({
    code,
    code_verifier,
    provider,
    state,
    device_id,
  }: {
    code: string;
    code_verifier: string;
    provider: TProvider;
    state?: string;
    device_id?: string;
  }) {
    let oauthAccount;

    if (provider === "vk") {
      if (!state || !device_id) {
        throw new AppError("invalid vk oauth callback", 400);
      }

      oauthAccount = await this.oauth.getAccount(
        { code, code_verifier, state, device_id },
        provider,
      );
    } else {
      oauthAccount = await this.oauth.getAccount({ code, code_verifier }, provider);
    }

    let account: IAccount | null = await this.accountRepo.find({
      provider: oauthAccount.provider,
      provider_account_id: oauthAccount.provider_account_id,
    });

    let user: IUser | IUserWithPassword | null;

    const familyId = crypto.randomUUID();
    const jti = crypto.randomUUID();

    if (!account) {
      user = await this.userRepo.findByEmail(oauthAccount.email);

      if (!user) {
        user = await this.userRepo.create({ email: oauthAccount.email });
      }

      account = await this.accountRepo.create({
        provider: oauthAccount.provider,
        provider_account_id: oauthAccount.provider_account_id,
        user_id: user.id,
      });
    }

    user = await this.userRepo.findById(account.user_id);

    if (!user) throw new AppError("user not found", 404);

    const accessToken = this.tokenService.generateAccessToken(user.id);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, jti, familyId);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  sendRedirectUrl({
    state,
    codeChallenge,
    provider,
  }: {
    state: string;
    codeChallenge: string;
    provider: TProvider;
  }) {
    return this.oauth.getRedirectUrl(state, codeChallenge, provider);
  }
}
