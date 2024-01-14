import { DisposeFn, Log } from '~/lib/service/mod.ts';
import { MQ } from '~/external/mq/mod.ts';
import { SM } from '~/external/sm/mod.ts';
import { NodeFS } from '~/blocks/nodefs/mod.ts';
import { Vault } from '~/blocks/vault/mod.ts';
import { WrappedFunction } from './wrap.ts';

export class API {
  public readonly log: Log;
  public readonly mq: MQ;
  public readonly sm: SM;
  public readonly nodefs: NodeFS;
  public readonly vault: Vault;
  private disposables = new Set<DisposeFn>();

  private constructor(log: Log, mq: MQ, sm: SM, nodefs: NodeFS, vault: Vault) {
    this.log = log;
    this.mq = mq;
    this.sm = sm;
    this.nodefs = nodefs;
    this.vault = vault;
  }

  static async create(log: Log, mq: MQ, sm: SM, nodefs: NodeFS, vault: Vault) {
    return new API(log.create('api'), mq, sm, nodefs, vault);
  }

  async load(fns: WrappedFunction[]) {
    for (const fn of fns) {
      const disposeFn = await fn.load(this);
      this.disposables.add(disposeFn);
    }
  }

  async destroy() {
    const disposables = this.disposables.values();

    for (const disposeFn of disposables) {
      try {
        this.disposables.delete(disposeFn);
        await disposeFn();
      } catch (error) {
        this.log.error('failed to cleanup disposable', error);
      }
    }
  }
}
