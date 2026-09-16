export interface IRefreshTokenPayload {
  user_id: string;
  familyId: string;
  jti: string;
}

export interface IRotatedRefreshToken {
  refreshToken: string;
  user_id: string;
}

export interface ITokenService {
  generateAccessToken(user_id: string): string;
  generateRefreshToken(user_id: string, jti: string, familyId: string): Promise<string>;
  verifyAccessToken(token: string): string | null;
  verifyRefreshToken(token: string): Promise<IRefreshTokenPayload | null>;
  rotateRefreshToken(token: string): Promise<IRotatedRefreshToken | null>;
  revokeRefreshToken(token: string): Promise<void>;
}
