import { createHash, randomBytes } from "node:crypto";
import type { ILoginData, IRegisterData } from "../../application/dtos";
import { AuthService, OauthService } from "../../domain/services/authorization";
import { RedisClient } from "../../infrastructure/db/redis.client";
import { createHandler } from "../utils/create-handler";
import { AppError } from "../../shared";

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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken, user });
  });

  login = createHandler<ILoginData>(async (req, res) => {
    const { accessToken, refreshToken, user } = await this.authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
    });

    res.status(204).send();
  });

  githubLogin = createHandler(async (_req, res) => {
    const state = crypto.randomUUID();
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    await this.redis.set(`oauth:state:${state}`, codeVerifier, {
      expiration: { type: "EX", value: 600 },
    });

    const url = this.oauthService.sendRedirectUrl({ state, codeChallenge });

    res.redirect(url);
  });

  githubCallback = createHandler(async (req, res) => {
    if (typeof req.query.error === "string") {
      throw new AppError("GitHub authorization failed", 401);
    }

    const code = req.query.code;
    const state = req.query.state;

    if (typeof code !== "string" || typeof state !== "string") {
      throw new AppError("invalid oauth callback", 400);
    }

    const codeVerifier = await this.redis.GETDEL(`oauth:state:${state}`);

    if (!codeVerifier) {
      throw new AppError("invalid oauth state", 401);
    }

    const { accessToken, refreshToken, user } = await this.oauthService.oauthLogin({
      code,
      code_verifier: codeVerifier,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken, user });
  });
}
