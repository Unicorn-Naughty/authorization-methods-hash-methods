import { IAccount } from "../../../domain/entities";
import { ICreateAccountData, IFindAccountData } from "../../dtos";

export interface IAccountRepository {
  create(data: ICreateAccountData): Promise<IAccount>;
  find(data: IFindAccountData): Promise<IAccount | null>;
  delete(id: string): Promise<void>;
}
