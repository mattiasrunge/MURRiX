import { Collection } from 'mongo';
import { Password, PasswordId } from '../types.ts';

/**
 * @description Remove a password
 */
export const unsetPassword = async (
  col: Collection<Password>,
  id: PasswordId,
) => {
  await col.deleteOne({ _id: id });

  return true;
};
