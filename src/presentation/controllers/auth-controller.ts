import type { ILoginData, IOauthCallbackQuery, IRegisterData } from "../../application/dtos";
import { TProvider } from "../../application/ports/services";
import { AuthService, OauthService } from "../../domain/services/authorization";
import { createHandler } from "../utils/create-handler";
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from "../utils/refresh-cookie";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OauthService,
  ) {}

  register = createHandler<IRegisterData>(async (req, res) => {
    const { accessToken, refreshToken, user } = await this.authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user });
  });

  login = createHandler<ILoginData>(async (req, res) => {
    const { accessToken, refreshToken, user } = await this.authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken, user });
  });

  refresh = createHandler(async (req, res) => {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.cookies[REFRESH_COOKIE],
    );
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken });
  });

  logout = createHandler(async (req, res) => {
    const token = req.cookies[REFRESH_COOKIE];

    if (token) {
      await this.authService.logout(token);
    }

    clearRefreshCookie(res);
    res.status(204).send();
  });

  oauthLogin = createHandler<unknown, Record<string, string>, { provider: TProvider }>(
    async (req, res) => {
      const url = await this.oauthService.startLogin(req.query.provider);
      res.redirect(url);
    },
  );

  oauthCallback = createHandler<unknown, Record<string, string>, IOauthCallbackQuery>(
    async (req, res) => {
      const { accessToken, refreshToken, user } = await this.oauthService.oauthLogin(req.query);
      setRefreshCookie(res, refreshToken);
      res.status(201).json({ accessToken, user });
    },
  );
}
