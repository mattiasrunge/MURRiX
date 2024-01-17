import * as scrypt from 'scrypt';
import { Collection } from 'mongo';
import { Password, PasswordId } from '../types.ts';

/**
 * @description Check password
 */

export const verifyPassword = async (
  col: Collection<Password>,
  id: PasswordId,
  password: string,
) => {
  const p = await col.findOne({ _id: id });

  if (!p) {
    throw new Error('invalid id');
  }

  return scrypt.verify(password, p.hash);
};
