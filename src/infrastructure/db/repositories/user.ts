import { Prisma } from "@prisma/client";
import { ICreateUserData } from "../../../application/dtos";
import { IUser, IUserWithPassword } from "../../../domain/entities";
import { AppError } from "../../../domain/errors";
import { IUserRepository } from "../../../application/ports/repositories";
import { prisma } from "../prisma.client";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export class PrismaUserRepository implements IUserRepository {
  async create(data: ICreateUserData): Promise<IUser> {
    try {
      const user = await prisma().user.create({ data });
      return { id: user.id, email: user.email };
    } catch (error) {
      if (isUniqueViolation(error)) throw new AppError("User already exists", 400);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<IUserWithPassword | null> {
    const user = await prisma().user.findUnique({ where: { email } });
    if (!user) return null;
    return { id: user.id, email: user.email, password: user.password ?? null };
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await prisma().user.findUnique({ where: { id } });
    if (!user) return null;
    return { id: user.id, email: user.email };
  }

  async delete(id: string): Promise<void> {
    await prisma().user.delete({ where: { id } });
  }
}
