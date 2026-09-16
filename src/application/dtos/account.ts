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
