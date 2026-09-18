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
}

export interface IGetVKAccountData extends IGetAccountData {
  state: string;
  device_id: string;
}

export interface IGetVKAccountResponse {
  refresh_token: string;
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  user_id: number | string;
  state: string;
  scope: string;
}

export interface IGetVKAccountUserResponse {
  user: {
    user_id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar: string;
    email?: string;
  };
}

export interface IGetAccountResponse {
  provider: string;
  provider_account_id: string;
  email: string;
}

export interface IGithubOauthTokenRes {
  access_token?: string;
  error?: string;
}

export interface IGithubOauthUserRes {
  id: number;
  email: string | null;
}

export interface IGithubOauthEmailsRes {
  email: string;
  primary: boolean;
  verified: boolean;
}
