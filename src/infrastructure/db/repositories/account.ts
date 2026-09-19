import { Prisma } from "@prisma/client";
import { ICreateAccountData, IFindAccountData } from "../../../application/dtos";
import { IAccount } from "../../../domain/entities";
import { AppError } from "../../../domain/errors";
import { IAccountRepository } from "../../../application/ports/repositories";
import { prisma } from "../prisma.client";

function toAccount(acc: {
  id: string;
  provider: string;
  provider_account_id: string;
  user_id: string;
}): IAccount {
  return {
    id: acc.id,
    provider: acc.provider,
    provider_account_id: acc.provider_account_id,
    user_id: acc.user_id,
  };
}

export class PrismaAccountRepository implements IAccountRepository {
  async create(data: ICreateAccountData): Promise<IAccount> {
    try {
      const acc = await prisma().account.create({ data });
      return toAccount(acc);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("oauth account already linked", 409);
      }
      throw error;
    }
  }

  async find(data: IFindAccountData): Promise<IAccount | null> {
    const acc = await prisma().account.findUnique({
      where: {
        provider_provider_account_id: {
          provider: data.provider,
          provider_account_id: data.provider_account_id,
        },
      },
    });

    if (!acc) return null;
    return toAccount(acc);
  }

  async delete(id: string): Promise<void> {
    await prisma().account.delete({ where: { id } });
  }
}
