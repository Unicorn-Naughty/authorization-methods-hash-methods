export interface ICreateAccountData {
  provider: string;
  provider_account_id: string;
  user_id: string;
}

export interface IFindAccountData {
  provider: string;
  provider_account_id: string;
}

export interface IGetAccountData {
  code: string;
  code_verifier: string;
  state?: string;
  device_id?: string;
}

export interface IGetAccountResponse {
  provider: string;
  provider_account_id: string;
  email: string;
  email_verified: boolean;
}

export interface IOauthCallbackQuery {
  error?: unknown;
  error_description?: unknown;
  code?: unknown;
  state?: unknown;
  device_id?: unknown;
  payload?: unknown;
}

