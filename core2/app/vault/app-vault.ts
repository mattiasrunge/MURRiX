import { DB } from '~/external/db/mod.ts';
import { MQ } from '~/external/mq/mod.ts';
import { exposeVault, VaultDB } from '~/blocks/vault/mod.ts';
import { App, Service } from '~/lib/service/mod.ts';
import { AppVaultConfig } from './types.ts';

export class AppVault extends App {
  public db: DB;
  public mq: MQ;
  public vault: VaultDB;

  constructor(service: Service, db: DB, mq: MQ, vault: VaultDB) {
    super(service);

    this.db = db;
    this.mq = mq;
    this.vault = vault;
  }

  static async create(service: Service, config: AppVaultConfig) {
    const db = await DB.connect(service, config.db);
    const mq = await MQ.connect(service, config.mq);
    const vault = await VaultDB.create(db);

    await exposeVault(vault, mq);

    const app = new AppVault(service, db, mq, vault);
    service.addApp(app);

    return app;
  }

  async stop() {
    await this.vault.destroy();
    await this.db.close();
    await this.mq.close();
  }
}
