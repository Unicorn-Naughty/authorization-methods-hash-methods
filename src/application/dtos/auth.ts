import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../../domain/entities";

export interface JWTPayload extends JwtPayload {
  userId: string;
  jti: string;
  familyId: string;
}

export interface IRegisterData {
  email: string;
  password: string;
}

export interface ILoginData {
  email: string;
  password: string;
}

export interface IAuthResult {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}
