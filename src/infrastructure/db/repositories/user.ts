import { PrismaClient } from "@prisma/client";
import { ICreateUserData } from "../../../application/dtos";
import { IUserRepository } from "../../../application/ports/repositories";
import { IUser, IUserWithPassword } from "../../../domain/entities";

export class PrismaUserRepository implements IUserRepository {
  constructor(private db: PrismaClient) {}

  async create(data: ICreateUserData): Promise<IUser> {
    const user = await this.db.user.create({ data });
    return { id: user.id, email: user.email };
  }
  async findByEmail(email: string): Promise<IUserWithPassword | null> {
    const user = await this.db.user.findFirst({ where: { email } });
    if (!user) return null;
    return { id: user.id, email: user.email, ...(user.password && { password: user.password }) };
  }
  async findById(id: string): Promise<IUser | null> {
    const user = await this.db.user.findFirst({ where: { id } });
    if (!user) return null;
    return { id: user.id, email: user.email };
  }
  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }
}
