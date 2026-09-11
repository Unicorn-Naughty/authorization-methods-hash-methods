import type { ILoginData, IRegisterData } from "../../application/dtos";
import { AuthService } from "../../domain/services";
import { createHandler } from "../utils/create-handler";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = createHandler<IRegisterData>(async (req, res) => {
    const { accessToken, refreshToken, user } = await this.authService.register(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
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
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ accessToken, user });
  });

  refresh = createHandler<{ refreshToken: string }>(async (req, res) => {
    const { accessToken, refreshToken } = await this.authService.refresh(req.body.refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ accessToken });
  });

  logout = createHandler<{ refreshToken: string }>(async (req, res) => {
    const token = req.cookies.refreshToken;

    if (token) {
      await this.authService.logout(req.body.refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
    });

    res.status(204).send();
  });
}
