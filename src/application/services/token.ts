export interface ITokenService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): Promise<string>;
  verifyAccessToken(token: string): string | null;
  verifyRefreshToken(token: string): Promise<string | null>;
}