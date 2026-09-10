import { IRegisterData, IAuthResult, ILoginData } from "../../application/dtos";
import { IUserRepository } from "../../application/ports/repositories";
import { IHashService, ITokenService } from "../../application/ports/services";
import { AppError } from "../../shared";

export class AuthService {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userRepo: IUserRepository,
  ) {}

  async register(data: IRegisterData): Promise<IAuthResult> {
    const existingUser = await this.userRepo.findByEmail(data.email);

    if (existingUser) throw new AppError("User already exists", 400);

    const hashedPass = await this.hashService.hash(data.password);

    const user = await this.userRepo.create({ ...data, password: hashedPass });

    const accessToken = this.tokenService.generateAccessToken(user.id);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user };
  }

  async login(data: ILoginData): Promise<IAuthResult> {
    const user = await this.userRepo.findByEmail(data.email);

    if (!user) throw new AppError("invalid credentials", 401);

    const checkCompare = await this.hashService.compare(data.password, user.password);

    if (!checkCompare) throw new AppError("invalid credentials", 401);

    const accessToken = this.tokenService.generateAccessToken(user.id);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: { id: user.id, email: user.email } };
  }

  async refresh(refreshToken: string) {
    const userId = await this.tokenService.verifyRefreshToken(refreshToken);

    if (!userId) throw new AppError("invalid refresh token", 401);

    const user = await this.userRepo.findById(userId);

    if (!user) throw new AppError("User not found", 404);

    const aToken = this.tokenService.generateAccessToken(user.id);
    const rToken = await this.tokenService.generateRefreshToken(user.id);

    return {
      accessToken: aToken,
      refreshToken: rToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }
}
