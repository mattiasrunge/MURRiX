import { DB } from '~/lib/external/db/mod.ts';
import { MQ } from '~/lib/external/mq/mod.ts';
import { MQ } from '~/lib/external/mq/mod.ts';
import { exposeFile, FileDB } from '~/lib/file/mod.ts';
import { App, Service } from '~/lib/service/mod.ts';
import { AppFileConfig } from './types.ts';

export class AppFile extends App {
  public db: DB;
  public mq: MQ;
  public file: FS;

  constructor(service: Service, db: DB, mq: MQ, file: FileDB) {
    super(service);

    this.db = db;
    this.mq = mq;
    this.file = file;
  }

  static async create(service: Service, config: AppFileConfig) {
    const db = await DB.connect(service, config.db);
    const mq = await MQ.connect(service, config.mq);
    const file = await FileDB.create(db);

    await exposeFile(file, mq);

    const app = new AppFile(service, db, mq, file);
    service.addApp(app);

    return app;
  }

  async stop() {
    await this.file.destroy();
    await this.db.close();
    await this.mq.close();
  }
}
