import { PrismaClient } from "@prisma/client";
import { ICreateAccountData, IFindAccountData } from "../../../application/dtos";
import { IAccountRepository } from "../../../application/ports/repositories/account";
import { IAccount } from "../../../domain/entities";

export class PrismaAccountRepository implements IAccountRepository {
  constructor(private db: PrismaClient) {}

  async create(data: ICreateAccountData): Promise<IAccount> {
    const acc = await this.db.account.create({ data });
    return {
      id: acc.id,
      provider: acc.provider,
      provider_account_id: acc.provider_account_id,
      user_id: acc.user_id,
    };
  }

  async find(data: IFindAccountData): Promise<IAccount | null> {
    const acc = await this.db.account.findUnique({
      where: {
        provider_provider_account_id: {
          provider: data.provider,
          provider_account_id: data.provider_account_id,
        },
      },
    });

    if (!acc) return null;

    return {
      id: acc.id,
      provider: acc.provider,
      provider_account_id: acc.provider_account_id,
      user_id: acc.user_id,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.account.delete({ where: { id } });
  }
}
