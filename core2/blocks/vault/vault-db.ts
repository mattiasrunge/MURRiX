import * as scrypt from 'scrypt';
import { DB } from '~/external/db/mod.ts';
import { Password } from './internal-types.ts';
import { Vault } from './vault.ts';
import { PasswordId } from './types.ts';

export class VaultDB extends Vault {
  protected db: DB;

  protected constructor(db: DB) {
    super();

    this.db = db;
  }

  static async create(db: DB) {
    return new VaultDB(db);
  }

  async destroy() {}

  async setPassword(password: string) {
    const id = crypto.randomUUID();
    const collection = this.db.collection<Password>('passwords');

    await collection.updateOne({ _id: id }, {
      $set: {
        created: Date.now(),
        hash: await scrypt.hash(password),
      },
    }, { upsert: true });

    return id;
  }

  async unsetPassword(id: PasswordId) {
    const collection = this.db.collection<Password>('passwords');

    await collection.deleteOne({ _id: id });

    return true;
  }

  async verifyPassword(id: PasswordId, password: string) {
    const collection = this.db.collection<Password>('passwords');

    const p = await collection.findOne({ _id: id });

    if (!p) {
      throw new Error('invalid id');
    }

    return scrypt.verify(password, p.hash);
  }
}
