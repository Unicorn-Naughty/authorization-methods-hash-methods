import { IAccountRepository, IUserRepository } from "../../../application/ports/repositories";
import { IOauth, ITokenService } from "../../../application/ports/services";
import { AppError } from "../../../shared";
import { IAccount, IUser, IUserWithPassword } from "../../entities";

export class OauthService {
  constructor(
    private accountRepo: IAccountRepository,
    private userRepo: IUserRepository,
    private tokenService: ITokenService,
    private oauth: IOauth,
  ) {}

  async oauthLogin({ code, code_verifier }: { code: string; code_verifier: string }) {
    const githubAccount = await this.oauth.getAccount({ code, code_verifier });

    let account: IAccount | null = await this.accountRepo.find({
      provider: githubAccount.provider,
      provider_account_id: githubAccount.provider_account_id,
    });

    let user: IUser | IUserWithPassword | null;

    const familyId = crypto.randomUUID();
    const jti = crypto.randomUUID();

    if (!account) {
      user = await this.userRepo.findByEmail(githubAccount.email);

      if (!user) {
        user = await this.userRepo.create({ email: githubAccount.email });
      }

      account = await this.accountRepo.create({
        provider: githubAccount.provider,
        provider_account_id: githubAccount.provider_account_id,
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

  sendRedirectUrl({ state, codeChallenge }: { state: string; codeChallenge: string }) {
    return this.oauth.getRedirectUrl(state, codeChallenge);
  }
}
