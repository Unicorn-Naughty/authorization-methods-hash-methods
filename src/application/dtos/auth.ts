import { IUser } from "../../domain/entities";

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
