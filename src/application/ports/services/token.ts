export interface IRefreshTokenPayload {
  userId: string;
  familyId: string;
  jti: string;
}

export interface IRotatedRefreshToken {
  refreshToken: string;
  userId: string;
  familyId: string;
  jti: string;
}

export interface ITokenService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string, jti: string, familyId: string): Promise<string>;
  verifyAccessToken(token: string): string | null;
  verifyRefreshToken(token: string): Promise<IRefreshTokenPayload | null>;
  rotateRefreshToken(token: string): Promise<IRotatedRefreshToken | null>;
  revokeRefreshToken(token: string): Promise<void>;
}
