export interface IUser {
  _id: string;
  address: string;
  twitterId: string;
  signature: string;
  approved?: boolean;
}

export interface IUpdateUser {
  address: string;
  signature: string;
  approved?: boolean;
}
