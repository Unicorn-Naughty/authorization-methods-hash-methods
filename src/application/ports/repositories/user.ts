import { IUser } from "../../../domain/entities";

export interface IUserRepository {
  create(data: {
    email: string;
    password: string;
  }): Promise<IUser>;

  findByEmail(email: string): Promise<IUser | null>;

  findById(id: string): Promise<IUser | null>;

  delete(id: string): Promise<void>;
}