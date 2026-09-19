import { createHash, randomBytes } from "node:crypto";
import { IOauthCallbackQuery } from "../../../application/dtos";
import { IAccountRepository, IUserRepository } from "../../../application/ports/repositories";
import {
  IOauthProvider,
  IOauthSessionStore,
  ITokenService,
  isProvider,
  TProvider,
} from "../../../application/ports/services";
import { IUnitOfWork } from "../../../application/ports/transaction";
import { IAccount, IUser, IUserWithPassword } from "../../entities";
import { AppError } from "../../errors";
import { normalizeEmail } from "../../utils/email";

const OAUTH_STATE_TTL_SECONDS = 600;

function parseOauthSession(raw: string): { provider: TProvider; codeVerifier: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("invalid oauth state", 401);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("provider" in parsed) ||
    !("codeVerifier" in parsed) ||
    !isProvider(parsed.provider) ||
    typeof parsed.codeVerifier !== "string"
  ) {
    throw new AppError("invalid oauth state", 401);
  }

  return { provider: parsed.provider, codeVerifier: parsed.codeVerifier };
}

function readOauthCallback(query: IOauthCallbackQuery) {
  let code = query.code;
  let state = query.state;
  let deviceId = query.device_id;

  if (typeof query.payload === "string") {
    try {
      const payload = JSON.parse(query.payload) as {
        code?: unknown;
        state?: unknown;
        device_id?: unknown;
      };
      if (typeof payload.code === "string") code = payload.code;
      if (typeof payload.state === "string") state = payload.state;
      if (typeof payload.device_id === "string") deviceId = payload.device_id;
    } catch {
      throw new AppError("invalid oauth callback", 400);
    }
  }

  if (typeof code !== "string" || typeof state !== "string") {
    throw new AppError("invalid oauth callback", 400);
  }

  return {
    code,
    state,
    device_id: typeof deviceId === "string" ? deviceId : undefined,
  };
}

export class OauthService {
  constructor(
    private accountRepo: IAccountRepository,
    private userRepo: IUserRepository,
    private tokenService: ITokenService,
    private oauth: Record<TProvider, IOauthProvider>,
    private sessionStore: IOauthSessionStore,
    private uow: IUnitOfWork,
  ) {}

  async startLogin(provider: TProvider) {
    const adapter = this.oauth[provider];
    if (!adapter) throw new AppError("unsupported oauth provider", 400);

    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    await this.sessionStore.save(
      state,
      JSON.stringify({ provider, codeVerifier }),
      OAUTH_STATE_TTL_SECONDS,
    );

    return adapter.getRedirectUrl(state, codeChallenge);
  }

  async oauthLogin(query: IOauthCallbackQuery) {
    if (typeof query.error === "string") {
      throw new AppError("oauth denied", 401);
    }

    const callback = readOauthCallback(query);
    const sessionRaw = await this.sessionStore.consume(callback.state);

    if (!sessionRaw) {
      throw new AppError("invalid oauth state", 401);
    }

    const session = parseOauthSession(sessionRaw);
    const adapter = this.oauth[session.provider];
    if (!adapter) throw new AppError("unsupported oauth provider", 400);

    const oauthAccount = await adapter.getAccount({
      code: callback.code,
      code_verifier: session.codeVerifier,
      state: callback.state,
      device_id: callback.device_id,
    });

    if (!oauthAccount.email_verified) {
      throw new AppError("oauth email is not verified", 400);
    }

    const email = normalizeEmail(oauthAccount.email);

    const { user } = await this.uow.run(async () => {
      let account: IAccount | null = await this.accountRepo.find({
        provider: oauthAccount.provider,
        provider_account_id: oauthAccount.provider_account_id,
      });

      let foundUser: IUser | IUserWithPassword | null;

      if (!account) {
        foundUser = await this.userRepo.findByEmail(email);

        if (!foundUser) {
          foundUser = await this.userRepo.create({ email });
        }

        account = await this.accountRepo.create({
          provider: oauthAccount.provider,
          provider_account_id: oauthAccount.provider_account_id,
          user_id: foundUser.id,
        });
      }

      foundUser = await this.userRepo.findById(account.user_id);

      if (!foundUser) throw new AppError("user not found", 404);

      return { user: foundUser };
    });

    const tokens = await this.tokenService.issueTokenPair(user.id);

    return {
      ...tokens,
      user: { id: user.id, email: user.email },
    };
  }
}
