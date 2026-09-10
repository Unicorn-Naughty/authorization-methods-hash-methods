import { IUser, IUserWithPassword } from "../../../domain/entities";

export interface IUserRepository {
  create(data: {
    email: string;
    password: string;
  }): Promise<IUser>;

  findByEmail(email: string): Promise<IUserWithPassword | null>;

  findById(id: string): Promise<IUser | null>;

  delete(id: string): Promise<void>;
}