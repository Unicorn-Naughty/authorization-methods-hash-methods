import { createHash, randomBytes } from "node:crypto";
import type { ILoginData, IRegisterData } from "../../application/dtos";
import { AuthService, OauthService } from "../../domain/services/authorization";
import { RedisClient } from "../../infrastructure/db/redis.client";
import { createHandler } from "../utils/create-handler";
import { parseOauthSession, readOauthCallback } from "../utils/oauth";
import { AppError } from "../../shared";
import { TProvider } from "../../application/ports/services";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OauthService,
    private readonly redis: RedisClient,
  ) {}

  register = createHandler<IRegisterData>(async (req, res) => {
    const { accessToken, refreshToken, user } = await this.authService.register(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken, user });
  });

  login = createHandler<ILoginData>(async (req, res) => {
    const { accessToken, refreshToken, user } = await this.authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ accessToken, user });
  });

  refresh = createHandler(async (req, res) => {
    const token = (req.cookies.refreshToken && typeof req.cookies.refreshToken === "string") ?? "";

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken });
  });

  logout = createHandler(async (req, res) => {
    const token = req.cookies.refreshToken;

    if (token) {
      await this.authService.logout(token);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth",
    });

    res.status(204).send();
  });

  oauthLogin = createHandler(async (req, res) => {
    const provider = req.query.provider as TProvider;

    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify({ provider, codeVerifier }),
      {
        expiration: { type: "EX", value: 600 },
      },
    );

    const url = this.oauthService.sendRedirectUrl({ state, codeChallenge, provider });

    res.redirect(url);
  });

  oauthCallback = createHandler(async (req, res) => {
    if (typeof req.query.error === "string") {
      const description =
        typeof req.query.error_description === "string"
          ? req.query.error_description
          : req.query.error;
      throw new AppError(description, 401);
    }

    const callback = readOauthCallback(req.query);
    const sessionRaw = await this.redis.GETDEL(`oauth:state:${callback.state}`);

    if (!sessionRaw) {
      throw new AppError("invalid oauth state", 401);
    }

    const session = parseOauthSession(sessionRaw);

    if (session.provider === "vk" && !callback.device_id) {
      throw new AppError("invalid vk oauth callback", 400);
    }

    const { accessToken, refreshToken, user } = await this.oauthService.oauthLogin({
      code: callback.code,
      code_verifier: session.codeVerifier,
      provider: session.provider,
      state: callback.state,
      device_id: callback.device_id,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken, user });
  });
}
