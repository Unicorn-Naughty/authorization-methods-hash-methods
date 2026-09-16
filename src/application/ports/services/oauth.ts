import { IGetAccountData, IGetAccountResponse } from "../../dtos";

export interface IOauth {
  getRedirectUrl(state: string, code_challenge: string): string;
  getAccount(data: IGetAccountData): Promise<IGetAccountResponse>;
}
