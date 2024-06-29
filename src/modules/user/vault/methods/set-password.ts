import * as scrypt from 'scrypt';
import { Collection } from '@db/mongo';
import { Password } from '../types.ts';

/**
 * @description Set a password
 */
export const setPassword = async (
  col: Collection<Password>,
  password: string,
) => {
  const id = crypto.randomUUID();

  await col.updateOne({ _id: id }, {
    $set: {
      created: Date.now(),
      hash: await scrypt.hash(password),
    },
  }, { upsert: true });

  return id;
};
