import { PasswordId } from './types.ts';

export type Password = {
  _id: PasswordId;
  created: number;
  hash: string;
};

export type SetPasswordReq = {
  password: string;
};
export type SetPasswordRes = PasswordId;

export type UnsetPasswordReq = {
  id: PasswordId;
};
export type UnsetPasswordRes = boolean;

export type VerifyPasswordReq = {
  id: PasswordId;
  password: string;
};
export type VerifyPasswordRes = boolean;
