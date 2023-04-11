import { Common, DisposeFn } from '~/layers/0_common/mod.ts';
import { SM } from './sm/mod.ts';
import { MQ } from './mq/mod.ts';

export class LightPhysical {
  public common: Common;
  public instanceId: string;
  public mq: MQ;
  public sm: SM;
  private registry: FinalizationRegistry<any>;
  private disposables = new Set<DisposeFn>();

  protected constructor(common: Common, instanceId: string, sm: SM, mq: MQ) {
    this.common = common;
    this.instanceId = instanceId;
    this.sm = sm;
    this.mq = mq;
    this.registry = new FinalizationRegistry(this.cleanDisposable.bind(this));
  }

  static async create(common: Common) {
    const instanceId = crypto.randomUUID();
    const sm = await SM.connect(instanceId, common.config.sm);
    const mq = await MQ.connect(instanceId, common.config.mq);

    return new this(common, instanceId, sm, mq);
  }

  async destroy() {
    const disposables = this.disposables.values();

    for (const disposeFn of disposables) {
      await this.cleanDisposable(disposeFn);
    }

    await this.mq.close();
    await this.sm.close();
  }

  private async cleanDisposable(disposeFn: DisposeFn) {
    try {
      this.disposables.delete(disposeFn);
      await disposeFn();
    } catch (error) {
      this.common.log.error('Failed to cleanup disposable', error);
    }
  }

  public addDisposable(ref: any, disposeFn: DisposeFn) {
    this.disposables.add(disposeFn);
    this.registry.register(ref, disposeFn);
  }
}
