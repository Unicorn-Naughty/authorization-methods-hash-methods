import { IAuthResult, ILoginData, IRegisterData } from "../../../application/dtos";
import { IUserRepository } from "../../../application/ports/repositories";
import { IHashService, ITokenService } from "../../../application/ports/services";
import { AppError } from "../../errors";
import { normalizeEmail } from "../../utils/email";

export class AuthService {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userRepo: IUserRepository,
  ) {}

  async register(data: IRegisterData): Promise<IAuthResult> {
    const email = normalizeEmail(data.email);
    const existingUser = await this.userRepo.findByEmail(email);

    if (existingUser) throw new AppError("User already exists", 400);

    const hashedPass = await this.hashService.hash(data.password);
    const user = await this.userRepo.create({ email, password: hashedPass });
    const tokens = await this.tokenService.issueTokenPair(user.id);

    return { ...tokens, user };
  }

  async login(data: ILoginData): Promise<IAuthResult> {
    const email = normalizeEmail(data.email);
    const user = await this.userRepo.findByEmail(email);

    if (!user || !user.password) throw new AppError("invalid credentials", 401);

    const checkCompare = await this.hashService.compare(data.password, user.password);

    if (!checkCompare) throw new AppError("invalid credentials", 401);

    const tokens = await this.tokenService.issueTokenPair(user.id);

    return { ...tokens, user: { id: user.id, email: user.email } };
  }

  async refresh(refreshToken: string) {
    const rotated = await this.tokenService.rotateRefreshToken(refreshToken);

    if (!rotated) throw new AppError("invalid refresh token", 401);

    const user = await this.userRepo.findById(rotated.user_id);

    if (!user) throw new AppError("User not found", 404);

    return {
      accessToken: this.tokenService.generateAccessToken(user.id),
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }
}
