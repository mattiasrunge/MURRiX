import { Common } from '~/layers/0_common/mod.ts';
import { FS } from './fs/mod.ts';
import { SM } from './sm/mod.ts';
import { DB } from './db/mod.ts';
import { MQ } from './mq/mod.ts';
import { LightPhysical } from './light-physical.ts';

export class FullPhysical extends LightPhysical {
  public db: DB;
  public fs: FS;

  protected constructor(common: Common, instanceId: string, fs: FS, db: DB, sm: SM, mq: MQ) {
    super(common, instanceId, sm, mq);
    this.db = db;
    this.fs = fs;
  }

  static async create(common: Common) {
    const instanceId = crypto.randomUUID();
    const fs = await FS.connect(instanceId, common.config.fs);
    const db = await DB.connect(instanceId, common.config.db);
    const sm = await SM.connect(instanceId, common.config.sm);
    const mq = await MQ.connect(instanceId, common.config.mq);

    return new FullPhysical(common, instanceId, fs, db, sm, mq);
  }

  async destroy() {
    await super.destroy();

    await this.db.close();
    await this.fs.close();
  }
}
