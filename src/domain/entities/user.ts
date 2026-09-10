export interface IUser {
  id: string
  email: string
}

export interface IUserWithPassword extends IUser {
  password: string;
}