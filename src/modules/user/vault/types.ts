export type PasswordId = string;

export type Password = {
  _id: PasswordId;
  created: number;
  hash: string;
};
