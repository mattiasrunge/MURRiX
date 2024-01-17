import { SM } from '~/external/sm/mod.ts';
import { MQ } from '~/external/mq/mod.ts';
import { NodeFSClient } from '~/blocks/nodefs/mod.ts';
import { VaultClient } from '~/blocks/vault/mod.ts';
import { API } from '~/blocks/api/mod.ts';
import { node, people, user } from '~/functions/mod.ts';
import { App, Service } from '~/lib/service/mod.ts';
import { AppVaultConfig } from './types.ts';

export class AppApi extends App {
  public sm: SM;
  public mq: MQ;
  public nodefs: NodeFSClient;
  public vault: VaultClient;
  public api: API;

  constructor(service: Service, sm: SM, mq: MQ, nodefs: NodeFSClient, vault: VaultClient, api: API) {
    super(service);

    this.sm = sm;
    this.mq = mq;
    this.nodefs = nodefs;
    this.vault = vault;
    this.api = api;
  }

  static async create(service: Service, config: AppVaultConfig) {
    const sm = await SM.connect(service, config.sm);
    const mq = await MQ.connect(service, config.mq);
    const nodefs = await NodeFSClient.create(mq);
    const vault = await VaultClient.create(mq);
    const api = await API.create(service.log, mq, sm, nodefs, vault);

    await api.load([
      ...Object.values(node),
      ...Object.values(user),
      ...Object.values(people),
    ]);

    const app = new AppApi(service, sm, mq, nodefs, vault, api);
    service.addApp(app);

    return app;
  }

  async stop() {
    await this.api.destroy();
    await this.vault.destroy();
    await this.nodefs.destroy();
    await this.sm.close();
    await this.mq.close();
  }
}
