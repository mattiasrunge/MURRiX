import { DB } from '~/external/db/mod.ts';
import { MQ } from '~/external/mq/mod.ts';
import { exposeNodeFS, NodeFSDB } from '~/blocks/nodefs/mod.ts';
import { App, Service } from '~/lib/service/mod.ts';
import { AppNodeFSConfig } from './types.ts';

export class AppNodeFS extends App {
  public db: DB;
  public mq: MQ;
  public nodefs: NodeFSDB;

  constructor(service: Service, db: DB, mq: MQ, nodefs: NodeFSDB) {
    super(service);

    this.db = db;
    this.mq = mq;
    this.nodefs = nodefs;
  }

  static async create(service: Service, config: AppNodeFSConfig) {
    const db = await DB.connect(service, config.db);
    const mq = await MQ.connect(service, config.mq);
    const nodefs = await NodeFSDB.create(db);

    await exposeNodeFS(nodefs, mq);

    const app = new AppNodeFS(service, db, mq, nodefs);
    service.addApp(app);

    return app;
  }

  async stop() {
    await this.nodefs.destroy();
    await this.db.close();
    await this.mq.close();
  }
}
